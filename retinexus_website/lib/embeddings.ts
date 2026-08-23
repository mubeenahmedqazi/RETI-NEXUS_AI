/**
 * Remote embeddings for the Eye Doctor Agent's RAG knowledge base, via the Hugging Face
 * Inference API. Previously ran locally on-device via @xenova/transformers, which selects
 * onnxruntime-node (a prebuilt native binary) whenever `process.release.name === 'node'` —
 * true on Vercel's serverless runtime, where the binary can't load ("libonnxruntime.so.1.14.0:
 * cannot open shared object file"), crashing every request that touched RAG. Calling HF's
 * hosted feature-extraction endpoint instead means no native binary, no WASM runtime, and no
 * multi-hundred-MB model download inside the serverless function at all.
 */
const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const HF_API_URL = `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`;

// HF batches every string in one HTTP call; keeping batches modest avoids oversized
// request/response payloads when ingest-knowledge.ts embeds an entire PDF corpus at once.
const BATCH_SIZE = 32;

function getHfToken(): string {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error('HF_TOKEN environment variable is not set.');
  return token;
}

function isNumberArray(x: unknown): x is number[] {
  return Array.isArray(x) && (x.length === 0 || typeof x[0] === 'number');
}

function meanPool(tokenVectors: number[][]): number[] {
  const dims = tokenVectors[0]?.length ?? 0;
  const sums = new Array(dims).fill(0);
  for (const vec of tokenVectors) {
    for (let i = 0; i < dims; i++) sums[i] += vec[i];
  }
  return sums.map((s) => s / tokenVectors.length);
}

function normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

// The Inference API returns different shapes depending on the model/backend: either an
// already-pooled sentence vector (flat number[]) or a raw per-token matrix (number[][]) that
// needs mean-pooling ourselves — handle both rather than assuming one. Either way, normalize
// to match the L2-normalized embeddings the local pipeline previously produced (searchKnowledge
// in ../vectorStore treats a plain dot product as cosine similarity, which only holds for
// normalized vectors).
function toEmbedding(item: unknown): number[] {
  if (isNumberArray(item)) return normalize(item);
  if (Array.isArray(item) && isNumberArray(item[0])) return normalize(meanPool(item as number[][]));
  throw new Error('Unexpected embedding shape from Hugging Face Inference API');
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getHfToken()}`,
      'Content-Type': 'application/json',
    },
    // wait_for_model: the free-tier endpoint cold-starts the model on first use; this makes
    // HF hold the request until it's ready instead of immediately returning a 503.
    body: JSON.stringify({ inputs: texts, options: { wait_for_model: true } }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Hugging Face embeddings request failed (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error('Unexpected embeddings response from Hugging Face Inference API');
  return data.map(toEmbedding);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    results.push(...(await embedBatch(batch)));
  }
  return results;
}

export async function embedText(text: string): Promise<number[]> {
  const [embedding] = await embedBatch([text]);
  return embedding;
}
