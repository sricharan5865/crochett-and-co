import { NextResponse } from 'next/server';
import { verifyPassword, createSessionToken, getSessionCookieName } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const ok = await verifyPassword(password);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const token = createSessionToken();
    const cookieName = getSessionCookieName();

    const response = NextResponse.json({ success: true });
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (e: any) {
    console.error('Login API Error:', e);
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
