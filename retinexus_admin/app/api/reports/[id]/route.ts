import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const report = await prisma.report.findUnique({
    where: { id },
    select: {
      id: true,
      reportNumber: true,
      patientId: true,
      patientName: true,
      drGrade: true,
      confidence: true,
      description: true,
      imageUrl: true,
      processedAt: true,
      reportData: true,
      clinicalReport: true,
      createdAt: true,
      doctor: { select: { id: true, name: true } },
    },
  });

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  return NextResponse.json(report);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const existing = await prisma.report.findUnique({
    where: { id },
    select: { reportNumber: true, _count: { select: { detailedAnalyses: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  // DetailedAnalysis.reportId is optional but still a real foreign key — a Detailed
  // Analysis correlated against this report would be left pointing at a deleted row, so
  // deletion is blocked while any exist rather than silently orphaning that link.
  if (existing._count.detailedAnalyses > 0) {
    const n = existing._count.detailedAnalyses;
    return NextResponse.json(
      {
        error: `Cannot delete Report #${existing.reportNumber} — ${n} detailed analysis record${n === 1 ? '' : 's'} ${n === 1 ? 'is' : 'are'} linked to it. Delete ${n === 1 ? 'that record' : 'those records'} first.`,
      },
      { status: 409 }
    );
  }

  await prisma.report.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
