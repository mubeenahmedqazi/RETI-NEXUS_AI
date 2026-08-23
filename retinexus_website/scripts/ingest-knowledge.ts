/**
 * Builds data/eye-knowledge-index.json from every PDF in knowledge/pdfs/.
 * Run after adding or changing PDFs: npm run ingest:knowledge
 */
import fs from 'fs/promises';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { embedTexts } from '../lib/embeddings';
import type { KnowledgeChunk } from '../lib/vectorStore';

const PDF_DIR = path.join(process.cwd(), 'knowledge', 'pdfs');
const OUTPUT_PATH = path.join(process.cwd(), 'data', 'eye-knowledge-index.json');

async function main() {
  let files: string[];
  try {
    files = (await fs.readdir(PDF_DIR)).filter((f) => f.toLowerCase().endsWith('.pdf'));
  } catch {
    console.error(`No knowledge/pdfs/ directory found at ${PDF_DIR}`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.log('No PDFs found in knowledge/pdfs/ — drop your ophthalmology PDFs there and re-run this script.');
    return;
  }

  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 800, chunkOverlap: 120 });
  const allChunks: { text: string; source: string }[] = [];

  for (const file of files) {
    const filePath = path.join(PDF_DIR, file);
    const buffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: buffer });
    const { text } = await parser.getText();
    await parser.destroy();
    const pieces = await splitter.splitText(text);
    console.log(`${file}: ${pieces.length} chunks`);
    for (const piece of pieces) {
      const cleaned = piece.replace(/\s+/g, ' ').trim();
      if (cleaned.length > 40) allChunks.push({ text: cleaned, source: file });
    }
  }

  console.log(`Embedding ${allChunks.length} chunks locally (first run downloads the embedding model, ~90MB)...`);
  const embeddings = await embedTexts(allChunks.map((c) => c.text));

  const index: KnowledgeChunk[] = allChunks.map((chunk, i) => ({
    id: `${chunk.source}-${i}`,
    text: chunk.text,
    source: chunk.source,
    embedding: embeddings[i],
  }));

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(index));
  console.log(`Wrote ${index.length} chunks to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
