import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const statusFilter = request.nextUrl.searchParams.get('status');

  const doctors = await prisma.user.findMany({
    where: {
      role: 'DOCTOR',
      ...(statusFilter && ['PENDING', 'APPROVED', 'BLOCKED'].includes(statusFilter)
        ? { status: statusFilter as 'PENDING' | 'APPROVED' | 'BLOCKED' }
        : {}),
    },
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
      _count: { select: { patients: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ doctors });
}
