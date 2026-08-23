import { ChatGroq } from '@langchain/groq';
import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { getPool } from '../db';

// Lazily constructed — see the matching comment in ../agents/graph.ts's routerModel for why:
// ChatGroq throws synchronously on a missing GROQ_API_KEY, and building it eagerly at
// module scope turned a missing key into a whole-route-crash instead of a caught error.
let model: ChatGroq | null = null;
function getModel(): ChatGroq {
  if (!model) {
    model = new ChatGroq({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      apiKey: process.env.GROQ_API_KEY,
      temperature: 0,
    });
  }
  return model;
}

export interface ReportLookupSlots {
  patientName?: string;
  phoneNumber?: string;
  reportId?: string;
}

const EXTRACTION_PROMPT = `Extract patient report lookup details from the latest user message.
Return ONLY a JSON object with these keys (omit a key entirely if not present in the message):
- patientName: the patient's full name, if stated
- phoneNumber: the phone number, if stated (digits, keep as written)
- reportId: the report ID / report number, if stated (e.g. "RN-000123", "000123", or a raw ID)

Do not guess or invent values. Do not include any text other than the JSON object.`;

/** Uses Groq to pull whatever of {name, phone, reportId} appear in the newest user turn. */
export async function extractSlots(history: BaseMessage[]): Promise<ReportLookupSlots> {
  const lastHuman = [...history].reverse().find((m) => m instanceof HumanMessage);
  const text = typeof lastHuman?.content === 'string' ? lastHuman.content : '';
  if (!text.trim()) return {};

  try {
    const response = await getModel().invoke(
      [new SystemMessage(EXTRACTION_PROMPT), new HumanMessage(text)],
      { response_format: { type: 'json_object' } },
    );
    const raw = typeof response.content === 'string' ? response.content : '{}';
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const slots: ReportLookupSlots = {};
    if (typeof parsed.patientName === 'string' && parsed.patientName.trim()) slots.patientName = parsed.patientName.trim();
    if (typeof parsed.phoneNumber === 'string' && parsed.phoneNumber.trim()) slots.phoneNumber = parsed.phoneNumber.trim();
    if (typeof parsed.reportId === 'string' && parsed.reportId.trim()) slots.reportId = parsed.reportId.trim();
    return slots;
  } catch {
    return {};
  }
}

export function missingSlots(slots: ReportLookupSlots): string[] {
  const missing: string[] = [];
  if (!slots.patientName) missing.push('the patient\'s full name');
  if (!slots.phoneNumber) missing.push('the phone number on file');
  if (!slots.reportId) missing.push('the report ID');
  return missing;
}

// --- Lightweight abuse protection -----------------------------------------
// Single-instance in-memory limiter. Good enough for a dev/small deployment;
// a multi-instance production deployment should swap this for a shared store
// (e.g. Redis) so limits are enforced across instances.
const attempts = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > MAX_ATTEMPTS;
}

export interface ReportLookupResult {
  found: boolean;
  summary: string;
}

// reports.reportNumber is a Postgres int4 — anything outside this range (e.g. a
// pasted date/timestamp mistaken for a report ID) must never reach the query,
// or the driver throws "value out of range for type integer" and crashes the turn.
const INT4_MAX = 2147483647;

/** Runs the actual patient/report lookup with a fully parameterized query — no string-built SQL. */
export async function runReportLookup(slots: Required<ReportLookupSlots>): Promise<ReportLookupResult> {
  const digits = slots.reportId.replace(/[^0-9]/g, '');
  const parsedDigits = digits ? parseInt(digits, 10) : NaN;
  const reportNumberCandidate = Number.isFinite(parsedDigits) && parsedDigits >= 0 && parsedDigits <= INT4_MAX ? parsedDigits : null;

  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT r."reportNumber", r."drGrade", r.confidence, r."processedAt", r."createdAt", p.name
     FROM reports r
     JOIN patients p ON p.id = r."patientId"
     WHERE lower(p.name) = lower($1)
       AND regexp_replace(p.phone, '[^0-9]', '', 'g') = regexp_replace($2, '[^0-9]', '', 'g')
       AND (r.id = $3 OR r."reportNumber" = $4)
     ORDER BY r."createdAt" DESC
     LIMIT 1`,
    [slots.patientName, slots.phoneNumber, slots.reportId, reportNumberCandidate],
  );

  if (rows.length === 0) {
    return {
      found: false,
      summary: "I couldn't find a report matching that name, phone number, and report ID. Please double-check the details, or contact the clinic directly.",
    };
  }

  const r = rows[0];
  const date = new Date(r.processedAt || r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return {
    found: true,
    summary: `Found it. Report RN-${String(r.reportNumber).padStart(6, '0')} for ${r.name}: DR grade **${r.drGrade}** (confidence ${(Number(r.confidence) * 100).toFixed(0)}%), screened on ${date}. For the full clinical report and images, please log in to the patient portal or contact your doctor's office.`,
  };
}
