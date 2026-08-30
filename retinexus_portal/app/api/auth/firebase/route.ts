import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import prisma from '@/lib/db';
import { createDoctorSession } from '@/lib/auth/session';

// Single endpoint for every doctor Firebase auth path (password sign-in, password
// sign-up, and Google) — by the time any of them reach the server it's just a verified
// Firebase ID token, so one find-or-create-and-gate flow covers all three. Verified via
// `jose` against Firebase's JWKS rather than the firebase-admin SDK, since that would
// need a service-account key this project doesn't have set up.
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

interface FirebaseAuthBody {
  idToken: string;
  profile?: {
    name?: string;
    hospital?: string;
    phone?: string;
    specialization?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { idToken, profile } = (await request.json()) as FirebaseAuthBody;

    if (!idToken) {
      return NextResponse.json({ error: 'Missing Firebase ID token' }, { status: 400 });
    }

    let payload;
    try {
      ({ payload } = await jwtVerify(idToken, JWKS, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
      }));
    } catch (verifyError) {
      console.error('Firebase token verification failed:', verifyError);
      return NextResponse.json({ error: 'Invalid or expired sign-in. Please try again.' }, { status: 401 });
    }

    const email = payload.email as string | undefined;
    const uid = payload.sub as string;

    if (!email) {
      return NextResponse.json({ error: 'This Firebase account has no email address.' }, { status: 400 });
    }

    let doctor = await prisma.user.findUnique({ where: { email } });

    if (!doctor) {
      doctor = await prisma.user.create({
        data: {
          email,
          name: profile?.name || (payload.name as string | undefined) || email.split('@')[0],
          password: null,
          role: 'DOCTOR',
          status: 'PENDING',
          firebaseUid: uid,
          hospital: profile?.hospital || null,
          phone: profile?.phone || null,
          specialization: profile?.specialization || null,
        },
      });
    } else if (!doctor.firebaseUid) {
      // Existing pre-Firebase doctor authenticating for the first time — link by email,
      // leave their status/profile/patients/reports untouched.
      doctor = await prisma.user.update({
        where: { id: doctor.id },
        data: { firebaseUid: uid },
      });
    } else if (doctor.firebaseUid !== uid) {
      return NextResponse.json(
        { error: 'This email is already linked to a different sign-in identity.' },
        { status: 409 }
      );
    }

    if (doctor.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Access denied. Only doctors can use this sign-in.' }, { status: 403 });
    }

    if (doctor.status === 'PENDING') {
      return NextResponse.json(
        { error: 'Your account is pending admin approval. You will be able to sign in once approved.' },
        { status: 403 }
      );
    }

    if (doctor.status === 'BLOCKED') {
      return NextResponse.json(
        { error: 'Your account has been blocked. Please contact support.' },
        { status: 403 }
      );
    }

    await createDoctorSession(doctor);

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
  } catch (error) {
    console.error('Firebase auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
