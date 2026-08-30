import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

const SESSION_COOKIES = [
  'auth_token',
  'user_id',
  'doctor_id',
  'user_role',
  'user_name',
  'doctor_name',
];

// Clears a stale/orphaned session (e.g. token points at a deleted user) so the
// client stops being treated as authenticated and middleware won't loop it
// back into a protected route.
async function invalidSession(body: { error: string }, status: number) {
  const cookieStore = await cookies();
  for (const name of SESSION_COOKIES) {
    cookieStore.delete(name);
  }
  return NextResponse.json(body, { status });
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const userId = cookieStore.get('user_id')?.value;

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

      if (tokenData.exp && Date.now() > tokenData.exp) {
        return invalidSession({ error: 'Token expired' }, 401);
      }
    } catch (error) {
      console.error('❌ Failed to decode token:', error);
      return invalidSession({ error: 'Invalid token' }, 401);
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
          status: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      if (!doctor) {
        return invalidSession({ error: 'Doctor not found' }, 404);
      }

      // Re-checked on every call (not just at login) so a block takes effect within one
      // request cycle instead of only at next sign-in.
      if (doctor.status !== 'APPROVED') {
        return invalidSession(
          {
            error:
              doctor.status === 'PENDING'
                ? 'Your account is pending admin approval.'
                : 'Your account has been blocked. Please contact support.',
          },
          403
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
        return invalidSession({ error: 'Patient not found' }, 404);
      }

      return NextResponse.json({
        ...patient,
        role: 'PATIENT',
      });
    }

    return invalidSession({ error: 'Unknown role' }, 401);

  } catch (error) {
    console.error('❌ Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user info: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
