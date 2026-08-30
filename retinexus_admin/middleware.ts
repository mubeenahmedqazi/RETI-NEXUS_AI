import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('admin_token')?.value;
  const adminId = request.cookies.get('admin_id')?.value;
  const isAuthed = Boolean(token && adminId);

  if (path === '/login') {
    if (isAuthed) return NextResponse.redirect(new URL('/dashboard', request.url));
    return NextResponse.next();
  }

  if (path.startsWith('/dashboard')) {
    if (!isAuthed) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (path.startsWith('/api/') && !path.startsWith('/api/auth')) {
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (path === '/') {
    return NextResponse.redirect(new URL(isAuthed ? '/dashboard' : '/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
