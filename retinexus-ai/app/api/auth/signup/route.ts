import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, hospital, phone, specialization } = await request.json();

    // Validate input
    if (!name || !email || !password || !hospital || !phone) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingDoctor = await prisma.user.findUnique({
      where: { email }
    });

    if (existingDoctor) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create doctor
    const doctor = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'DOCTOR',
        hospital,
        phone,
        specialization: specialization || '',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hospital: true,
        phone: true,
        specialization: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      doctorId: doctor.id,
      name: doctor.name,
      email: doctor.email,
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}