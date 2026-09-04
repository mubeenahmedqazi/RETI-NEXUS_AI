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
      reportCode: true,
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
    select: {
      reportNumber: true,
      imageUrl: true,
      imagePublicId: true,
      reportData: true,
      _count: { select: { detailedAnalyses: true } },
    },
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

  // Neon is deleted regardless (it's the source of truth) — Cloudinary cleanup is
  // best-effort on top, same pattern as doctor deletion's Firebase cleanup. Imported
  // dynamically so GET never pulls in the cloudinary package.
  let cloudinaryWarning: string | undefined;
  try {
    const { extractCloudinaryPublicId, deleteCloudinaryImages } = await import('@/lib/cloudinary');
    const reportData = (existing.reportData as Record<string, unknown>) || {};
    const images = (reportData.images as Record<string, string>) || {};
    const urls = [existing.imageUrl, ...Object.values(images)];
    const publicIds = urls.map(extractCloudinaryPublicId).filter((id): id is string => !!id);

    if (publicIds.length > 0) {
      const { deleted, failed } = await deleteCloudinaryImages(publicIds);
      if (failed > 0) {
        cloudinaryWarning = `Report #${existing.reportNumber} was deleted, but ${failed} of its ${publicIds.length} Cloudinary image(s) failed to delete. You may need to remove them manually from Cloudinary.`;
      }
    }
  } catch (err) {
    cloudinaryWarning = `Report #${existing.reportNumber} was deleted, but cleaning up its Cloudinary images failed: ${err instanceof Error ? err.message : 'Unknown error'}.`;
  }

  return NextResponse.json({ success: true, ...(cloudinaryWarning ? { warning: cloudinaryWarning } : {}) });
}
