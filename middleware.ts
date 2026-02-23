// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const publicPaths = [
  '/',
  '/products',
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/products',
  '/api/settings/public',
];

const adminOnlyPaths = ['/dashboard', '/api/admin'];
const adminEditorPaths = ['/editor'];
const authRequiredPaths = ['/cart', '/checkout', '/orders', '/profile'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Get token from cookie or header
  const token =
    req.cookies.get('token')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyToken(token);

  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // DB check for blocked users on all protected routes
  const dbUser = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { isBlocked: true },
  });

  if (!dbUser || dbUser.isBlocked) {
    const message = 'Your account has been blocked by admin. Contact support.';
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, message }, { status: 403 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('blocked', '1');
    return NextResponse.redirect(loginUrl);
  }

  // Admin only routes
  if (adminOnlyPaths.some((p) => pathname.startsWith(p))) {
    if (payload.role !== 'ADMIN') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Admin + Editor routes
  if (adminEditorPaths.some((p) => pathname.startsWith(p))) {
    if (!['ADMIN', 'EDITOR'].includes(payload.role)) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Add user info to headers for server components
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-email', payload.email);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
