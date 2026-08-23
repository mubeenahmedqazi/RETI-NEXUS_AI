/**
 * Local, no-API-key embeddings for the Eye Doctor Agent's RAG knowledge base.
 * Groq has no embeddings endpoint, so retrieval runs entirely on-device via
 * transformers.js (all-MiniLM-L6-v2) instead of adding another provider.
 */
import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers';

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', MODEL_ID) as Promise<FeatureExtractionPipeline>;
  }
  return extractorPromise;
}

export async function embedText(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const extractor = await getExtractor();
  const results: number[][] = [];
  for (const text of texts) {
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    results.push(Array.from(output.data as Float32Array));
  }
  return results;
}
