import { ChatGroq } from '@langchain/groq';
import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { mcpSearchKnowledge } from '../mcp/client';

const model = new ChatGroq({
  model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.3,
});

/**
 * Ophthalmology-only guardrail: the model must refuse anything outside eye
 * health / diabetic retinopathy / directly-related systemic risk (diabetes,
 * cardiovascular, renal — RetiNexus screens those alongside DR), and must
 * never diagnose or replace a clinician.
 */
const SYSTEM_PROMPT = `You are the RetiNexus AI Eye Doctor Assistant, a medical-information chatbot embedded on the RetiNexus AI website.

Scope — you may ONLY discuss:
- Eye and vision health: diabetic retinopathy, retinal disease, general ophthalmology, eye anatomy, eye symptoms, eye screening/exams.
- Directly related systemic risk factors RetiNexus screens for from retinal images: diabetes, cardiovascular risk, kidney (renal) risk — but only as they relate to eye/retinal health.
- RetiNexus AI itself: what it does, how retinal screening works, general product questions.

If the user asks about anything outside this scope (other medical specialties, unrelated topics, requests to write code, general chit-chat unrelated to eyes, etc.), politely decline and redirect them to ask an eye-health or RetiNexus-related question instead. Do not answer the off-topic question, even partially.

Rules:
- You are not a substitute for professional medical care. Never provide a diagnosis, prescribe treatment, or tell someone to stop/start medication. Encourage seeing an ophthalmologist or physician for any specific concern, urgent symptoms, or actual diagnosis.
- If "Reference material" is provided below, ground your answer in it and don't contradict it. If it's empty or irrelevant, answer from general medical knowledge without mentioning the absence of references. Never state something as fact if you are not confident it is medically accurate — say so and recommend a clinician instead of guessing.
- Be concise and precise: no filler, no repeating the question back, no padding sentences. Every sentence should carry information the user asked for.

Formatting (this renders as Markdown in the chat widget):
- For a short, direct question (e.g. "what is DR?", "is X normal?"), answer in 1-3 tight sentences — no headings needed.
- For a broader question that naturally breaks into parts (e.g. causes, symptoms, stages, prevention), use 2-4 short **bold headings** on their own line, each followed by 1-2 concise sentences or a short bullet list. Do not force headings onto a simple answer just to use them.
- End every substantive medical answer with a brief italic one-line disclaimer, e.g. "*This is general information, not a diagnosis — please consult an eye-care professional for your specific situation.*"`;

/**
 * RAG: retrieves relevant PDF chunks, then streams a guarded, cited answer from Groq.
 * `onToken`, if given, is called with each text delta as it arrives — the caller
 * decides how those deltas reach the client (kept decoupled from LangGraph here).
 */
export async function streamEyeAnswer(history: BaseMessage[], onToken?: (text: string) => void): Promise<string> {
  const lastHuman = [...history].reverse().find((m) => m instanceof HumanMessage);
  const query = typeof lastHuman?.content === 'string' ? lastHuman.content : '';

  const chunks = query ? await mcpSearchKnowledge(query, 4) : [];
  const context = chunks.length
    ? `Reference material (from RetiNexus's ophthalmology knowledge base):\n${chunks
        .map((c, i) => `[${i + 1}] (${c.source}) ${c.text}`)
        .join('\n\n')}`
    : 'Reference material: (none retrieved for this question — answer from general medical knowledge)';

  const promptMessages = [new SystemMessage(SYSTEM_PROMPT), new SystemMessage(context), ...history];

  const stream = await model.stream(promptMessages);
  let full = '';
  for await (const piece of stream) {
    const text = typeof piece.content === 'string' ? piece.content : '';
    if (text) {
      full += text;
      onToken?.(text);
    }
  }
  return full;
}
