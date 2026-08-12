import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { compare } from 'bcryptjs';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, password, role, patientId } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!role || !['doctor', 'patient'].includes(role)) {
      return NextResponse.json(
        { error: 'Please select a valid role (Doctor or Patient)' },
        { status: 400 }
      );
    }

    // === DOCTOR LOGIN ===
    if (role === 'doctor') {
      const doctor = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          name: true,
          role: true,
          hospital: true,
          phone: true,
          specialization: true,
          isActive: true,
        }
      });

      if (!doctor) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      if (doctor.role !== 'DOCTOR') {
        return NextResponse.json(
          { error: 'Access denied. Only doctors can login.' },
          { status: 403 }
        );
      }

      if (!doctor.isActive) {
        return NextResponse.json(
          { error: 'Account is deactivated. Please contact support.' },
          { status: 403 }
        );
      }

      const isPasswordValid = await compare(password, doctor.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Create session token for doctor
      const tokenData = {
        userId: doctor.id,
        email: doctor.email,
        name: doctor.name,
        role: 'DOCTOR',
        hospital: doctor.hospital,
        phone: doctor.phone,
        specialization: doctor.specialization,
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      };
      
      const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');

      const cookieStore = await cookies();
      
      // Clear any existing cookies first
      cookieStore.delete('auth_token');
      cookieStore.delete('user_id');
      cookieStore.delete('doctor_id'); // <-- Also delete doctor_id
      cookieStore.delete('user_role');
      cookieStore.delete('user_name');
      cookieStore.delete('doctor_name'); // <-- Also delete doctor_name

      // Set new cookies - SET BOTH user_id AND doctor_id
      cookieStore.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });
      
      // Set user_id (for general use)
      cookieStore.set('user_id', doctor.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });

      // ✅ CRITICAL: Set doctor_id (for dashboard compatibility)
      cookieStore.set('doctor_id', doctor.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });

      cookieStore.set('user_role', 'DOCTOR', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });

      // Set both user_name and doctor_name
      cookieStore.set('user_name', doctor.name, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });

      cookieStore.set('doctor_name', doctor.name, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });

      return NextResponse.json({
        success: true,
        userId: doctor.id,
        doctorId: doctor.id,
        name: doctor.name,
        email: doctor.email,
        hospital: doctor.hospital,
        phone: doctor.phone,
        specialization: doctor.specialization,
        role: 'DOCTOR',
        redirectTo: '/dashboard',
      });
    }

    // === PATIENT LOGIN ===
    if (role === 'patient') {
      // Phone numbers are not unique (multiple patients — e.g. family members —
      // can share one phone), so a phone alone doesn't identify one account.
      // The login page has the visitor pick a specific profile first (via
      // /api/auth/patient-lookup) and sends that id here for a precise,
      // unambiguous check. If no patientId is sent (older clients), fall back
      // to matching password across every patient on that number.
      const candidates = await prisma.patient.findMany({
        where: patientId ? { id: patientId, phone: email } : { phone: email },
        select: {
          id: true,
          name: true,
          phone: true,
          password: true,
          doctorId: true,
          createdAt: true,
          doctor: {
            select: {
              name: true,
              hospital: true,
            }
          }
        }
      });

      if (candidates.length === 0) {
        return NextResponse.json(
          { error: 'Patient not found. Please check your phone number.' },
          { status: 401 }
        );
      }

      let patient: (typeof candidates)[number] | null = null;
      for (const candidate of candidates) {
        if (!candidate.password) continue;
        if (await compare(password, candidate.password)) {
          patient = candidate;
          break;
        }
      }

      if (!patient) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Create session token for patient
      const tokenData = {
        userId: patient.id,
        name: patient.name,
        role: 'PATIENT',
        doctorId: patient.doctorId,
        doctorName: patient.doctor?.name,
        hospital: patient.doctor?.hospital,
        exp: Date.now() + 24 * 60 * 60 * 1000
      };
      
      const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');

      const cookieStore = await cookies();
      
      // Clear any existing cookies first
      cookieStore.delete('auth_token');
      cookieStore.delete('user_id');
      cookieStore.delete('user_role');
      cookieStore.delete('user_name');

      // Set new cookies
      cookieStore.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });

      cookieStore.set('user_id', patient.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });

      cookieStore.set('user_role', 'PATIENT', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });

      cookieStore.set('user_name', patient.name, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });

      return NextResponse.json({
        success: true,
        userId: patient.id,
        name: patient.name,
        phone: patient.phone,
        role: 'PATIENT',
        doctorId: patient.doctorId,
        doctorName: patient.doctor?.name,
        hospital: patient.doctor?.hospital,
        redirectTo: '/patient/dashboard',
      });
    }

    return NextResponse.json(
      { error: 'Invalid role selected. Please choose Doctor or Patient.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}