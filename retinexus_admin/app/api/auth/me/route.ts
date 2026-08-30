import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { clearAdminSession } from '@/lib/auth/session';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  const adminId = cookieStore.get('admin_id')?.value;

  if (!token || !adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    if (tokenData.exp && Date.now() > tokenData.exp) {
      await clearAdminSession();
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }
  } catch {
    await clearAdminSession();
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  if (!admin) {
    await clearAdminSession();
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
  }

  return NextResponse.json(admin);
}
