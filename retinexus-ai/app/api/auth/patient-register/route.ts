import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { cnic, name, phone, password, age, gender, address } = await request.json();

    console.log('📝 Patient registration attempt:', { cnic, name, phone });

    // Validate input
    if (!cnic || !name || !phone || !password) {
      return NextResponse.json(
        { error: 'CNIC, Name, Phone, and Password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if patient already exists
    const existingPatient = await prisma.patient.findFirst({
      where: {
        OR: [
          { cnic: cnic },
          { phone: phone }
        ]
      }
    });

    if (existingPatient) {
      return NextResponse.json(
        { error: 'Patient with this CNIC or Phone already exists' },
        { status: 409 }
      );
    }

    // ✅ Self-registered - NO doctor assigned
    const hashedPassword = await hash(password, 10);

    const patient = await prisma.patient.create({
      data: {
        cnic,
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
        cnic: patient.cnic,
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