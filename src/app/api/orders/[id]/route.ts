import { NextResponse } from 'next/server';
import { getOrderById, saveOrder, deleteOrder } from '@/lib/db';
import type { Order } from '@/lib/data/orders';
import { isAuthenticated } from '@/lib/auth';

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: Params) {
  try {
    const isAuth = await isAuthenticated(req);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const isAuth = await isAuthenticated(req);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await getOrderById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const payload = await req.json();

    if (payload.status !== undefined) {
      const allowedStatuses = ['pending', 'shipped', 'completed', 'cancelled'];
      if (!allowedStatuses.includes(payload.status)) {
        return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
      }
    }

    // Update fields allowed to be updated by admin (e.g. status)
    const updated: Order = {
      ...existing,
      ...payload,
      id, // ensure ID remains the same
    };

    await saveOrder(updated);
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const isAuth = await isAuthenticated(req);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    if (!id || id.trim() === '') {
      return NextResponse.json({ error: 'Malformed ID' }, { status: 400 });
    }

    const existing = await getOrderById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    await deleteOrder(id);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
