import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isValidPhone } from '@/lib/utils';

// Public, pre-login lookup: given a phone number, return which patient
// profiles are registered on it — enough to recognize your own name, not
// enough to leak anything medical. No password/diabetesLevel/address/reports
// are selected here. Used by the login page to let a shared phone number
// (e.g. a family member's) pick the right profile before entering a password.
export async function GET(request: NextRequest) {
  try {
    const phone = request.nextUrl.searchParams.get('phone') || '';

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Phone number must be exactly 11 digits' },
        { status: 400 }
      );
    }

    const patients = await prisma.patient.findMany({
      where: { phone },
      select: {
        id: true,
        name: true,
        age: true,
        gender: true,
        doctorId: true,
        createdAt: true,
        doctor: {
          select: { name: true, hospital: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      profiles: patients.map((p) => ({
        id: p.id,
        name: p.name,
        age: p.age,
        gender: p.gender,
        registeredBy: p.doctor ? `Dr. ${p.doctor.name}${p.doctor.hospital ? ` · ${p.doctor.hospital}` : ''}` : 'Self-registered',
        selfRegistered: !p.doctorId,
      })),
    });
  } catch (error) {
    console.error('❌ Patient lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to look up patients for this phone number' },
      { status: 500 }
    );
  }
}
