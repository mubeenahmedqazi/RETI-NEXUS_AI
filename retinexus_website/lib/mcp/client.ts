/**
 * Singleton in-process MCP client for the tools server in ./server.ts. Created once per
 * Node process (memoized, same pattern as the embedding-model singleton in ../embeddings.ts)
 * and reused for every call. The client/server pair is wired together with InMemoryTransport
 * — same-process, no subprocess spawn and no network hop — so routing tool calls through MCP's
 * structured protocol costs no more than a direct function call would.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createRetiNexusToolsServer } from './server';
import type { KnowledgeChunk } from '../vectorStore';
import type { ReportLookupResult, ReportLookupSlots } from '../agents/reportSQLAgent';

let clientPromise: Promise<Client> | null = null;

function getClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const server = createRetiNexusToolsServer();
      const client = new Client({ name: 'retinexus-chatbot', version: '1.0.0' });
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
      return client;
    })();
  }
  return clientPromise;
}

function parseToolText<T>(result: unknown): T {
  const content = (result as { content?: unknown }).content;
  const first = Array.isArray(content) ? content[0] : undefined;
  if (!first || first.type !== 'text' || typeof first.text !== 'string') {
    throw new Error('MCP tool returned no text content');
  }
  return JSON.parse(first.text) as T;
}

export async function mcpSearchKnowledge(query: string, topK = 4): Promise<Pick<KnowledgeChunk, 'source' | 'text'>[]> {
  const client = await getClient();
  const result = await client.callTool({ name: 'search_eye_doctor_knowledge', arguments: { query, topK } });
  return parseToolText(result);
}

export async function mcpLookupReport(slots: Required<ReportLookupSlots>): Promise<ReportLookupResult> {
  const client = await getClient();
  const result = await client.callTool({ name: 'lookup_patient_report', arguments: slots });
  return parseToolText(result);
}
