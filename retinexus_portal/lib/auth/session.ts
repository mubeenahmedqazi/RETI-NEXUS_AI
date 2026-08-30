import { cookies } from 'next/headers';

type SessionDoctor = {
  id: string;
  email: string;
  name: string;
  hospital: string | null;
  phone: string | null;
  specialization: string | null;
};

/** Same cookie set / base64 token shape the app has always used for a doctor session
 * (see the removed doctor branch of app/api/auth/login/route.ts) — kept as-is so
 * middleware.ts and /api/auth/me don't need to change shape, regardless of whether the
 * session originated from a password or a Google sign-in. */
export async function createDoctorSession(doctor: SessionDoctor) {
  const tokenData = {
    userId: doctor.id,
    email: doctor.email,
    name: doctor.name,
    role: 'DOCTOR',
    hospital: doctor.hospital,
    phone: doctor.phone,
    specialization: doctor.specialization,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
  const cookieStore = await cookies();

  for (const name of ['auth_token', 'user_id', 'doctor_id', 'user_role', 'user_name', 'doctor_name']) {
    cookieStore.delete(name);
  }

  const secureOpts = {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24,
    path: '/',
  };

  cookieStore.set('auth_token', token, { ...secureOpts, httpOnly: true });
  cookieStore.set('user_id', doctor.id, { ...secureOpts, httpOnly: true });
  cookieStore.set('doctor_id', doctor.id, { ...secureOpts, httpOnly: true });
  cookieStore.set('user_role', 'DOCTOR', { ...secureOpts, httpOnly: true });
  cookieStore.set('user_name', doctor.name, { ...secureOpts, httpOnly: false });
  cookieStore.set('doctor_name', doctor.name, { ...secureOpts, httpOnly: false });
}
