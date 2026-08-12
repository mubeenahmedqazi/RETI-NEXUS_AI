import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    const patientId = cookieStore.get('user_id')?.value;

    if (!authToken || !patientId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get reports
    const reports = await prisma.report.findMany({
      where: {
        patientId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Found ${reports.length} reports`);

    return NextResponse.json(reports);

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}