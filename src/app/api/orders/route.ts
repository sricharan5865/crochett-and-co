import { NextResponse } from 'next/server';
import { getOrders, saveOrder } from '@/lib/db';
import type { Order, OrderItem } from '@/lib/data/orders';
import { isAuthenticated } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const isAuth = await isAuthenticated(req);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const list = await getOrders();
    return NextResponse.json(list);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Validate customer details
    if (!payload.customerName || typeof payload.customerName !== 'string' || !payload.customerName.trim()) {
      return NextResponse.json({ error: 'Missing or invalid customerName' }, { status: 400 });
    }
    if (!payload.customerEmail || typeof payload.customerEmail !== 'string' || !payload.customerEmail.includes('@')) {
      return NextResponse.json({ error: 'Missing or invalid customerEmail' }, { status: 400 });
    }
    if (!payload.customerPhone || typeof payload.customerPhone !== 'string' || !payload.customerPhone.trim()) {
      return NextResponse.json({ error: 'Missing or invalid customerPhone' }, { status: 400 });
    }

    // Validate items
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return NextResponse.json({ error: 'Items must be a non-empty array' }, { status: 400 });
    }

    const validatedItems: OrderItem[] = [];
    let calculatedTotal = 0;

    for (const item of payload.items) {
      if (!item.productId || typeof item.productId !== 'string' || !item.productId.trim()) {
        return NextResponse.json({ error: 'Item productId is required' }, { status: 400 });
      }
      if (!item.productName || typeof item.productName !== 'string' || !item.productName.trim()) {
        return NextResponse.json({ error: 'Item productName is required' }, { status: 400 });
      }
      if (typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json({ error: 'Item quantity must be a positive integer' }, { status: 400 });
      }
      if (typeof item.price !== 'number' || item.price < 0) {
        return NextResponse.json({ error: 'Item price must be a non-negative number' }, { status: 400 });
      }

      validatedItems.push({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      });

      calculatedTotal += item.quantity * item.price;
    }

    // Auto-generate ID if not provided
    const id = payload.id || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const order: Order = {
      id,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: payload.customerPhone,
      items: validatedItems,
      status: 'pending',
      totalAmount: calculatedTotal,
      date: payload.date || new Date().toISOString(),
    };

    await saveOrder(order);
    return NextResponse.json(order, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
