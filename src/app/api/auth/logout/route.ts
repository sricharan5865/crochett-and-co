import { NextResponse } from 'next/server';
import { getSessionCookieName } from '@/lib/auth';

export async function POST() {
  const cookieName = getSessionCookieName();
  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // expire immediately
  });
  return response;
}
