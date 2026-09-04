import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const doctorFilter = request.nextUrl.searchParams.get('doctorId');

  const patients = await prisma.patient.findMany({
    where: doctorFilter ? { doctorId: doctorFilter === 'none' ? null : doctorFilter } : {},
    select: {
      id: true,
      name: true,
      phone: true,
      age: true,
      gender: true,
      address: true,
      doctorId: true,
      createdAt: true,
      doctor: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const doctors = await prisma.user.findMany({
    where: { role: 'DOCTOR' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ patients, doctors });
}
