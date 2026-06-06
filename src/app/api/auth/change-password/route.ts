import { NextResponse } from 'next/server';
import { verifyPassword, updatePassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { currentPassword, newPassword } = await req.json();
    const ok = await verifyPassword(currentPassword);
    if (!ok) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    const updated = await updatePassword(newPassword);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update password' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
