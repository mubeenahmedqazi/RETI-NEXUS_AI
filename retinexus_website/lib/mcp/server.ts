/**
 * MCP server exposing RetiNexus's chatbot retrieval tools — knowledge-base search and patient
 * report lookup — as structured, schema-validated MCP tools instead of plain in-process
 * function calls. Both LangGraph agent nodes (see ../agents/graph.ts) go through this server
 * via the singleton client in ./client.ts, so the tool implementations stay swappable/testable
 * independently of the agent orchestration that calls them.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { searchKnowledge } from '../vectorStore';
import { runReportLookup, type ReportLookupSlots } from '../agents/reportSQLAgent';

export function createRetiNexusToolsServer(): McpServer {
  const server = new McpServer({ name: 'retinexus-tools', version: '1.0.0' });

  server.registerTool(
    'search_eye_doctor_knowledge',
    {
      title: 'Search Eye Doctor Knowledge Base',
      description:
        "Semantic search over RetiNexus's ophthalmology / diabetic-retinopathy knowledge base. Returns the top-K most relevant reference chunks for a natural-language question.",
      inputSchema: {
        query: z.string().describe('The natural-language question to search for.'),
        topK: z.number().int().min(1).max(10).optional().describe('How many chunks to return (default 4).'),
      },
    },
    async ({ query, topK }) => {
      const chunks = await searchKnowledge(query, topK ?? 4);
      return {
        content: [
          { type: 'text' as const, text: JSON.stringify(chunks.map((c) => ({ source: c.source, text: c.text }))) },
        ],
      };
    },
  );

  server.registerTool(
    'lookup_patient_report',
    {
      title: 'Lookup Patient Report',
      description:
        'Looks up a patient screening report by full name, phone number, and report ID. All three must match an existing record.',
      inputSchema: {
        patientName: z.string(),
        phoneNumber: z.string(),
        reportId: z.string(),
      },
    },
    async (slots: ReportLookupSlots) => {
      const result = await runReportLookup(slots as Required<ReportLookupSlots>);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }],
      };
    },
  );

  return server;
}
