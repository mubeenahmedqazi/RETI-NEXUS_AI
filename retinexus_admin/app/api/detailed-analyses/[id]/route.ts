import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const analysis = await prisma.detailedAnalysis.findUnique({
    where: { id },
    select: {
      id: true,
      patientId: true,
      testName: true,
      clinicalSummary: true,
      testFindings: true,
      organFindings: true,
      redFlags: true,
      recommendations: true,
      urgency: true,
      extractionMethod: true,
      createdAt: true,
      doctor: { select: { id: true, name: true } },
      // reportData supplies the Biomarker Dashboard / Lesion Detection / Output Images /
      // Predicted Risk sections — same "correlated against the screening report" content
      // the portal's DetailedAnalysisReport shows.
      report: { select: { id: true, reportNumber: true, reportData: true } },
    },
  });

  if (!analysis) {
    return NextResponse.json({ error: 'Detailed analysis not found' }, { status: 404 });
  }

  return NextResponse.json(analysis);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const existing = await prisma.detailedAnalysis.findUnique({ where: { id }, select: { testName: true } });
  if (!existing) {
    return NextResponse.json({ error: 'Detailed analysis not found' }, { status: 404 });
  }

  // Nothing else in the schema references a DetailedAnalysis, so this is always safe to
  // delete outright — no dependent-record guard needed.
  await prisma.detailedAnalysis.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
