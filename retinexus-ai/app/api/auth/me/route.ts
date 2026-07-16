import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const userId = cookieStore.get('user_id')?.value;

    console.log('🔍 Auth check - Token:', token ? 'exists' : 'missing');
    console.log('🔍 Auth check - UserId:', userId);

    if (!token || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized - No token or user ID found' },
        { status: 401 }
      );
    }

    // Decode token to get user info
    let decodedToken;
    try {
      const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
      decodedToken = tokenData;
      console.log('🔍 Decoded token:', tokenData);
      
      if (tokenData.exp && Date.now() > tokenData.exp) {
        console.log('❌ Token expired');
        return NextResponse.json(
          { error: 'Token expired' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('❌ Failed to decode token:', error);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is a DOCTOR
    if (decodedToken.role === 'DOCTOR') {
      const doctor = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          hospital: true,
          phone: true,
          specialization: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      if (!doctor) {
        return NextResponse.json(
          { error: 'Doctor not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ...doctor,
        role: 'DOCTOR',
      });
    }

    // Check if user is a PATIENT
    if (decodedToken.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { id: userId },
        select: {
          id: true,
          cnic: true,
          name: true,
          phone: true,
          age: true,
          gender: true,
          address: true,
          diabetesLevel: true,
          doctorId: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      if (!patient) {
        return NextResponse.json(
          { error: 'Patient not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ...patient,
        role: 'PATIENT',
      });
    }

    return NextResponse.json(
      { error: 'Unknown role' },
      { status: 401 }
    );

  } catch (error) {
    console.error('❌ Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user info: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}