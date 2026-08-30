import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { deleteFirebaseUser } from '@/lib/firebaseAdmin';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const doctor = await prisma.user.findUnique({
    where: { id, role: 'DOCTOR' },
    select: {
      id: true,
      name: true,
      email: true,
      hospital: true,
      phone: true,
      specialization: true,
      status: true,
      firebaseUid: true,
      createdAt: true,
      patients: {
        select: { id: true, name: true, phone: true, age: true, gender: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!doctor) {
    return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  }

  return NextResponse.json(doctor);
}

interface DoctorPatchBody {
  status?: 'PENDING' | 'APPROVED' | 'BLOCKED';
  name?: string;
  email?: string;
  hospital?: string;
  phone?: string;
  specialization?: string;
  newPassword?: string;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = (await request.json()) as DoctorPatchBody;

  const existing = await prisma.user.findUnique({ where: { id, role: 'DOCTOR' } });
  if (!existing) {
    return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (body.name !== undefined) data.name = body.name;
  if (body.email !== undefined) data.email = body.email;
  if (body.hospital !== undefined) data.hospital = body.hospital;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.specialization !== undefined) data.specialization = body.specialization;
  if (body.newPassword) {
    // Admin-set password only matters if the doctor ever falls back to a non-Firebase
    // login path in the future; harmless to store either way since doctor auth today
    // goes entirely through Firebase (see retinexus_portal's /api/auth/firebase).
    data.password = await hash(body.newPassword, 10);
  }

  const doctor = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      hospital: true,
      phone: true,
      specialization: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json(doctor);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const existing = await prisma.user.findUnique({
    where: { id, role: 'DOCTOR' },
    select: {
      name: true,
      firebaseUid: true,
      _count: { select: { patients: true, reports: true, detailedAnalyses: true } },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  }

  // Reports/DetailedAnalyses are real clinical records with a required (non-nullable)
  // doctorId — deleting a doctor who has any would either violate that constraint or
  // silently orphan medical history, so this is blocked outright rather than cascaded.
  // Patients aren't clinical records themselves, but reassign-first (via the Patients
  // page) keeps deletion an explicit, deliberate admin action instead of a surprise mass
  // un-assignment.
  const { patients, reports, detailedAnalyses } = existing._count;
  if (patients > 0 || reports > 0 || detailedAnalyses > 0) {
    const parts: string[] = [];
    if (patients > 0) parts.push(`${patients} patient${patients === 1 ? '' : 's'}`);
    if (reports > 0) parts.push(`${reports} screening report${reports === 1 ? '' : 's'}`);
    if (detailedAnalyses > 0) parts.push(`${detailedAnalyses} detailed analysis record${detailedAnalyses === 1 ? '' : 's'}`);
    return NextResponse.json(
      {
        error: `Cannot delete ${existing.name} — still has ${parts.join(', ')}. Reassign their patients to another doctor first (Patients page); doctors with existing screening or detailed-analysis records can't be deleted.`,
      },
      { status: 409 }
    );
  }

  await prisma.user.delete({ where: { id } });

  // Neon is deleted regardless (it's the source of truth) — the Firebase identity is
  // best-effort cleanup on top, since deleting it requires the Admin SDK/service account.
  let firebaseWarning: string | undefined;
  if (existing.firebaseUid) {
    const result = await deleteFirebaseUser(existing.firebaseUid);
    if (result.status === 'skipped_not_configured') {
      firebaseWarning = `${existing.name}'s account was removed, but their Firebase sign-in identity was NOT deleted — the Firebase Admin service account isn't configured yet. Remove it manually in the Firebase Console (Authentication → Users) if needed.`;
    } else if (result.status === 'error') {
      firebaseWarning = `${existing.name}'s account was removed, but deleting their Firebase sign-in identity failed: ${result.message}. You may need to remove it manually in the Firebase Console.`;
    }
  }

  return NextResponse.json({ success: true, ...(firebaseWarning ? { warning: firebaseWarning } : {}) });
}
