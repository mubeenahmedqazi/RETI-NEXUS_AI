import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public paths
  const publicPaths = ['/login', '/signup', '/'];
  const isPublicPath = publicPaths.includes(path);

  // Get authentication tokens
  const token = request.cookies.get('auth_token')?.value;
  const userId = request.cookies.get('user_id')?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const doctorId = request.cookies.get('doctor_id')?.value;

  // Redirect logged-in users away from public paths
  if (isPublicPath) {
    if (token && userId) {
      const redirectTo = userRole === 'PATIENT' ? '/patient/dashboard' : '/dashboard';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    return NextResponse.next();
  }

  // Protect doctor dashboard/page routes
  if (
    path.startsWith('/dashboard') ||
    path.startsWith('/patients') ||
    path.startsWith('/reports') ||
    path.startsWith('/upload')
  ) {
    if (!token || !doctorId) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Protect patient page routes
  if (path.startsWith('/patient')) {
    if (!token || !userId || userRole !== 'PATIENT') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Protect API routes (except auth)
  if (path.startsWith('/api/') && !path.startsWith('/api/auth')) {
    if (!token || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', userId);
    if (userRole) requestHeaders.set('x-user-role', userRole);
    if (doctorId) requestHeaders.set('x-doctor-id', doctorId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};