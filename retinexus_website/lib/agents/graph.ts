import { Annotation, END, MemorySaver, START, StateGraph, addMessages, getWriter } from '@langchain/langgraph';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatGroq } from '@langchain/groq';
import { streamEyeAnswer } from './eyeDoctorAgent';
import { extractSlots, isRateLimited, missingSlots, type ReportLookupSlots } from './reportSQLAgent';
import { mcpLookupReport } from '../mcp/client';

// Lazily constructed: ChatGroq's constructor throws synchronously if GROQ_API_KEY is
// missing. Building it at module scope meant a missing/misconfigured key crashed this
// entire route module on load (surfacing as Next.js's generic "page couldn't load" 500,
// not a friendly in-widget error) — deferring it to first use lets the route's own
// try/catch (app/api/chat/route.ts) turn that into a normal streamed error message.
let routerModel: ChatGroq | null = null;
function getRouterModel(): ChatGroq {
  if (!routerModel) {
    routerModel = new ChatGroq({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      apiKey: process.env.GROQ_API_KEY,
      temperature: 0,
    });
  }
  return routerModel;
}

// --- State schema -----------------------------------------------------------

export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({ reducer: addMessages, default: () => [] }),
  route: Annotation<'eye_doctor' | 'report_sql' | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
  slots: Annotation<ReportLookupSlots>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
  clientIp: Annotation<string>({ reducer: (_prev, next) => next, default: () => 'unknown' }),
  // One-shot override set by the widget's "Eye Doctor" / "Report Retrieval"
  // quick-select buttons: forces the very next turn to that agent without a
  // router call, then clears itself so normal per-turn classification resumes.
  pinned: Annotation<boolean>({ reducer: (_prev, next) => next, default: () => false }),
});

type State = typeof AgentState.State;

// --- Supervisor / router node ------------------------------------------------

const ROUTER_PROMPT = `You route a user's message to one of two specialist agents. Reply with ONLY one word: no punctuation, no explanation:

REPORT_SQL: the user wants to look up, fetch, or verify a specific patient screening report (mentions a report, report ID, "check my results", provides/asks for a name+phone+report ID, etc.)
EYE_DOCTOR: anything else, including general questions about eyes, vision, diabetic retinopathy, or RetiNexus itself.`;

async function supervisorNode(state: State): Promise<Partial<State>> {
  // User explicitly picked a mode via the widget's quick-select buttons —
  // honor it for this turn without spending a router call, then unpin.
  if (state.pinned && state.route) return { route: state.route, pinned: false };

  // Mid-lookup: keep collecting the three fields for the report agent rather
  // than re-routing every turn, so "John Doe" on its own turn still lands
  // back in the SQL agent instead of being treated as a fresh question.
  const inProgress = state.route === 'report_sql' && missingSlots(state.slots).length > 0;
  if (inProgress) return { route: 'report_sql' };

  const lastHuman = [...state.messages].reverse().find((m) => m instanceof HumanMessage);
  const text = typeof lastHuman?.content === 'string' ? lastHuman.content : '';

  const response = await getRouterModel().invoke([new SystemMessage(ROUTER_PROMPT), new HumanMessage(text)]);
  const decision = (typeof response.content === 'string' ? response.content : '').toUpperCase();
  return { route: decision.includes('REPORT_SQL') ? 'report_sql' : 'eye_doctor' };
}

function routeAfterSupervisor(state: State): 'eyeDoctor' | 'reportSQL' {
  return state.route === 'report_sql' ? 'reportSQL' : 'eyeDoctor';
}

// --- Eye Doctor Agent (RAG) --------------------------------------------------

async function eyeDoctorNode(state: State, config?: LangGraphRunnableConfig): Promise<Partial<State>> {
  // Explicit custom-stream writer — only text we push here reaches the
  // client, unlike "messages" stream mode, which also leaks internal calls
  // (e.g. the supervisor's one-word routing decision) via ambient capture.
  const write = getWriter(config);
  const answer = await streamEyeAnswer(state.messages, write ? (text) => write(text) : undefined);
  return { messages: [new AIMessage(answer)] };
}

// --- Report SQL Agent ---------------------------------------------------------

async function reportSQLNode(state: State, config?: LangGraphRunnableConfig): Promise<Partial<State>> {
  const write = getWriter(config);
  const newSlots = await extractSlots(state.messages);
  const slots = { ...state.slots, ...newSlots };
  const missing = missingSlots(slots);

  if (missing.length > 0) {
    const ask = `To pull up that report I need ${missing.join(', ')}${missing.length > 1 ? ' as well' : ''}. Could you share ${missing.length > 1 ? 'those' : 'that'}?`;
    write?.(ask);
    return { slots, route: 'report_sql', messages: [new AIMessage(ask)] };
  }

  if (isRateLimited(state.clientIp)) {
    const text = "You've made too many lookup attempts recently. Please try again in a few minutes, or contact the clinic directly.";
    write?.(text);
    return { slots: {}, route: undefined, messages: [new AIMessage(text)] };
  }

  try {
    const result = await mcpLookupReport(slots as Required<ReportLookupSlots>);
    write?.(result.summary);
    // Lookup resolved (found or not) — clear slots so the next message starts fresh.
    return { slots: {}, route: undefined, messages: [new AIMessage(result.summary)] };
  } catch (err) {
    // Never leave broken slots in place — a DB error otherwise gets replayed
    // on every subsequent message since the client echoes slots back as-is.
    console.error('[reportSQL] lookup failed:', err);
    const text = "Sorry, I couldn't complete that lookup. Please double-check the details and try again.";
    write?.(text);
    return { slots: {}, route: undefined, messages: [new AIMessage(text)] };
  }
}

// --- Graph --------------------------------------------------------------------

const graph = new StateGraph(AgentState)
  .addNode('supervisor', supervisorNode)
  .addNode('eyeDoctor', eyeDoctorNode)
  .addNode('reportSQL', reportSQLNode)
  .addEdge(START, 'supervisor')
  .addConditionalEdges('supervisor', routeAfterSupervisor, { eyeDoctor: 'eyeDoctor', reportSQL: 'reportSQL' })
  .addEdge('eyeDoctor', END)
  .addEdge('reportSQL', END);

// Server-side conversation memory, keyed by a per-widget-session thread id (see
// app/api/chat/route.ts). Without this, the graph only ever knew about whatever
// `messages`/`slots` the client happened to echo back on a given request — fine as
// long as the browser tab stays open, but there was no actual memory of the
// conversation on the server. MemorySaver checkpoints state per thread_id so both
// agents (they share this one graph) pick up right where a thread left off.
const checkpointer = new MemorySaver();

export const chatGraph = graph.compile({ checkpointer });
