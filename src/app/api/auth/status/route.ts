import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const auth = await isAuthenticated(req);
  if (auth) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
