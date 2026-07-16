import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;

    console.log('🔍 Patient Reports API - authToken:', authToken ? 'exists' : 'missing');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Decode token to get CNIC
    let patientCnic = null;
    try {
      const tokenData = JSON.parse(Buffer.from(authToken, 'base64').toString());
      patientCnic = tokenData.cnic;
      console.log('🔍 Patient CNIC from token:', patientCnic);
    } catch (e) {
      console.error('❌ Failed to decode token:', e);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    if (!patientCnic) {
      return NextResponse.json(
        { error: 'Patient CNIC not found' },
        { status: 404 }
      );
    }

    // Get reports
    const reports = await prisma.report.findMany({
      where: {
        patientCnic: patientCnic
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