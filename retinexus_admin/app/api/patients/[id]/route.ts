import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth/requireAdmin';

// Deliberately no status/block field accepted here — patients are never blockable,
// only editable, per the admin app's requirements.
interface PatientPatchBody {
  name?: string;
  phone?: string;
  age?: number | null;
  gender?: string | null;
  address?: string | null;
  diabetesLevel?: string | null;
  doctorId?: string | null;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone: true,
      age: true,
      gender: true,
      address: true,
      diabetesLevel: true,
      doctorId: true,
      createdAt: true,
      doctor: { select: { id: true, name: true } },
      reports: {
        select: {
          id: true,
          reportNumber: true,
          drGrade: true,
          confidence: true,
          description: true,
          imageUrl: true,
          processedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      detailedAnalyses: {
        select: {
          id: true,
          testName: true,
          clinicalSummary: true,
          urgency: true,
          redFlags: true,
          recommendations: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  }

  return NextResponse.json(patient);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = (await request.json()) as PatientPatchBody;

  const existing = await prisma.patient.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.age !== undefined) data.age = body.age;
  if (body.gender !== undefined) data.gender = body.gender;
  if (body.address !== undefined) data.address = body.address;
  if (body.diabetesLevel !== undefined) data.diabetesLevel = body.diabetesLevel;
  if (body.doctorId !== undefined) data.doctorId = body.doctorId;

  const patient = await prisma.patient.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      phone: true,
      age: true,
      gender: true,
      address: true,
      diabetesLevel: true,
      doctorId: true,
      doctor: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(patient);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const existing = await prisma.patient.findUnique({
    where: { id },
    select: { name: true, _count: { select: { reports: true, detailedAnalyses: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  }

  // Reports/DetailedAnalyses have a required (non-nullable) patientId and are real
  // clinical records — a patient with existing scan/analysis history is medical record
  // retention, not a mistaken/empty profile, so deletion is blocked outright rather than
  // cascaded. Only an empty profile (no reports ever run) can be deleted here.
  const { reports, detailedAnalyses } = existing._count;
  if (reports > 0 || detailedAnalyses > 0) {
    const parts: string[] = [];
    if (reports > 0) parts.push(`${reports} screening report${reports === 1 ? '' : 's'}`);
    if (detailedAnalyses > 0) parts.push(`${detailedAnalyses} detailed analysis record${detailedAnalyses === 1 ? '' : 's'}`);
    return NextResponse.json(
      { error: `Cannot delete ${existing.name}: has ${parts.join(', ')} on file. Patients with existing clinical records can't be deleted.` },
      { status: 409 }
    );
  }

  await prisma.patient.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
