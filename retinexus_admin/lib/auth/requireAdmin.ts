import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/** Same-shape guard as the portal's cookie session checks — used at the top of every
 * protected API route (list/patch doctors & patients). Returns the decoded admin
 * tokenData on success, or a ready-to-return 401 NextResponse on failure. */
export async function requireAdmin(): Promise<
  { ok: true; adminId: string } | { ok: false; response: NextResponse }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  const adminId = cookieStore.get('admin_id')?.value;

  if (!token || !adminId) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  try {
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    if (tokenData.exp && Date.now() > tokenData.exp) {
      return { ok: false, response: NextResponse.json({ error: 'Session expired' }, { status: 401 }) };
    }
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Invalid session' }, { status: 401 }) };
  }

  return { ok: true, adminId };
}
