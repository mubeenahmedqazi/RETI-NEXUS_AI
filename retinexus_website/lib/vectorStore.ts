/**
 * Minimal local vector index for the Eye Doctor Agent's RAG lookups.
 * Built offline by `scripts/ingest-knowledge.ts` from the PDFs dropped into
 * knowledge/pdfs/, and loaded read-only here. No external vector DB — the
 * knowledge base is small enough that an in-process cosine-similarity scan
 * over a cached JSON index is simpler and faster than standing up pgvector
 * or a hosted vector store for it.
 */
import fs from 'fs/promises';
import path from 'path';
import { embedText } from './embeddings';

export interface KnowledgeChunk {
  id: string;
  text: string;
  source: string;
  embedding: number[];
}

const INDEX_PATH = path.join(process.cwd(), 'data', 'eye-knowledge-index.json');

let indexPromise: Promise<KnowledgeChunk[]> | null = null;

async function loadIndex(): Promise<KnowledgeChunk[]> {
  try {
    const raw = await fs.readFile(INDEX_PATH, 'utf-8');
    return JSON.parse(raw) as KnowledgeChunk[];
  } catch {
    // No index yet (no PDFs ingested) — RAG falls back to model-only answers.
    return [];
  }
}

function getIndex(): Promise<KnowledgeChunk[]> {
  if (!indexPromise) indexPromise = loadIndex();
  return indexPromise;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // embeddings are already L2-normalized, so dot product = cosine similarity
}

export async function searchKnowledge(query: string, topK = 4): Promise<KnowledgeChunk[]> {
  const chunks = await getIndex();
  if (chunks.length === 0) return [];

  const queryEmbedding = await embedText(query);
  return chunks
    .map((chunk) => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((r) => r.score > 0.2)
    .map((r) => r.chunk);
}
