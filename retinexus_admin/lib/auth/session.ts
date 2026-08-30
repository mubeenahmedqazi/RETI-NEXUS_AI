import { cookies } from 'next/headers';

type SessionAdmin = { id: string; email: string; name: string };

/** Separate cookie namespace from the portal's (admin_* vs. auth_token/user_id) since
 * this is a different app/origin — same base64 tokenData shape as the portal's doctor
 * session for consistency, no need to invent a different scheme. */
export async function createAdminSession(admin: SessionAdmin) {
  const tokenData = {
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
  const cookieStore = await cookies();

  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24,
    path: '/',
  };

  cookieStore.set('admin_token', token, opts);
  cookieStore.set('admin_id', admin.id, opts);
  cookieStore.set('admin_name', admin.name, { ...opts, httpOnly: false });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  for (const name of ['admin_token', 'admin_id', 'admin_name']) {
    cookieStore.delete(name);
  }
}
