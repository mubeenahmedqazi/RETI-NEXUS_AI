import { NextRequest } from 'next/server';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { chatGraph } from '@/lib/agents/graph';
import type { ReportLookupSlots } from '@/lib/agents/reportSQLAgent';

export const runtime = 'nodejs';

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  messages: ChatTurn[];
  slots?: ReportLookupSlots;
  route?: 'eye_doctor' | 'report_sql';
  pinned?: boolean;
  /** Persists across requests in the widget (localStorage) so the graph's MemorySaver
   * checkpointer (see lib/agents/graph.ts) can find this conversation's prior turns. */
  threadId?: string;
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const turns = Array.isArray(body.messages) ? body.messages : [];
  if (turns.length === 0) {
    return new Response('messages is required', { status: 400 });
  }

  // With a threadId, the graph's MemorySaver checkpointer (lib/agents/graph.ts)
  // already has every prior turn for this conversation — only the newest turn needs
  // to go in, and the `addMessages` reducer appends it onto the checkpointed history.
  // Without one (older client, or a fresh page load before the widget assigns one),
  // fall back to the old behavior of replaying the whole array the client sent.
  const toLangchainMessage = (m: ChatTurn) => (m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content));
  const langchainMessages: BaseMessage[] = body.threadId
    ? [toLangchainMessage(turns[turns.length - 1])]
    : turns.map(toLangchainMessage);

  const threadId = body.threadId || `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const initialState = {
    messages: langchainMessages,
    slots: body.slots || {},
    route: body.route,
    pinned: body.pinned || false,
    clientIp: getClientIp(req),
  };

  const encoder = new TextEncoder();
  let finalSlots: ReportLookupSlots = body.slots || {};
  let finalRoute: string | undefined = body.route;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // "custom" mode only carries what the nodes explicitly push via
        // getWriter() (see graph.ts) — unlike "messages" mode, nothing else
        // (e.g. the supervisor's internal routing decision) can leak into it.
        const graphStream = (await chatGraph.stream(initialState, {
          streamMode: ['custom', 'values'],
          configurable: { thread_id: threadId },
        })) as AsyncIterable<[string, unknown]>;

        for await (const [mode, chunk] of graphStream) {
          if (mode === 'custom') {
            const text = typeof chunk === 'string' ? chunk : '';
            if (text) controller.enqueue(encoder.encode(text));
          } else if (mode === 'values') {
            const state = chunk as { slots?: ReportLookupSlots; route?: string };
            if (state.slots) finalSlots = state.slots;
            finalRoute = state.route;
          }
        }
      } catch (err) {
        console.error('[chat] graph error:', err);
        controller.enqueue(encoder.encode('\n\nSorry, something went wrong on my end. Please try again in a moment.'));
      } finally {
        controller.enqueue(encoder.encode(`\n\n__STATE__${JSON.stringify({ slots: finalSlots, route: finalRoute })}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
