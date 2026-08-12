import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/db';
import { isValidPhone } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { name, phone, password, age, gender, address } = await request.json();

    console.log('📝 Patient registration attempt:', { name, phone });

    // Validate input
    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, Phone, and Password are required' },
        { status: 400 }
      );
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Phone number must be exactly 11 digits' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // ✅ Self-registered - NO doctor assigned
    const hashedPassword = await hash(password, 10);

    const patient = await prisma.patient.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        age: age ? parseInt(age) : null,
        gender,
        address,
        doctorId: null, // ✅ Self-registered - no doctor
      },
    });

    console.log('✅ Patient registered successfully (self):', patient.id);

    return NextResponse.json({
      success: true,
      message: 'Patient registered successfully!',
      patient: {
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
      },
    });

  } catch (error) {
    console.error('❌ Patient registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
