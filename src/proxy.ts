import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, getSessionCookieName } from './lib/auth-session';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cookieName = getSessionCookieName();
  const token = req.cookies.get(cookieName)?.value;
  const authenticated = token ? verifySessionToken(token) : false;

  // Protect admin dashboard page
  if (pathname.startsWith('/admin/dashboard')) {
    if (!authenticated) {
      // Redirect to /admin login screen
      const loginUrl = new URL('/admin', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect sensitive API routes
  const isAuthChangeApi = pathname.startsWith('/api/auth/change-password');
  const isProductsApi = pathname.startsWith('/api/products');

  if (isAuthChangeApi) {
    if (!authenticated) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (isProductsApi && req.method !== 'GET') {
    if (!authenticated) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  console.log(`[Proxy] Request path: ${pathname}, Method: ${req.method}, Authenticated: ${authenticated}`);
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/api/auth/change-password', '/api/products', '/api/products/:path*'],
};
