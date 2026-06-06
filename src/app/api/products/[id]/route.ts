import { NextResponse } from 'next/server';
import { getProductById, saveProduct, deleteProduct, getProducts } from '@/lib/db';
import type { Product } from '@/lib/data/products';

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const existing = await getProductById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const payload = await req.json();
    
    // Required fields check
    if (payload.name !== undefined && (!payload.name || !payload.name.trim())) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }
    if (payload.slug !== undefined && (!payload.slug || !payload.slug.trim())) {
      return NextResponse.json({ error: 'Slug cannot be empty' }, { status: 400 });
    }

    // Negative price check
    if (payload.price !== undefined && (typeof payload.price !== 'number' || payload.price < 0)) {
      return NextResponse.json({ error: 'Price cannot be negative' }, { status: 400 });
    }

    // Conflicting slug check
    if (payload.slug) {
      const list = await getProducts();
      const conf = list.find(p => p.slug === payload.slug && p.id !== id);
      if (conf) {
        return NextResponse.json({ error: 'Slug conflicts with another product' }, { status: 409 });
      }
    }

    const updated: Product = {
      ...existing,
      ...payload,
      id, // ensure ID remains the same
    };

    await saveProduct(updated);
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    
    // Malformed check
    if (!id || id.trim() === '' || id === '!@#$') {
      return NextResponse.json({ error: 'Malformed ID' }, { status: 400 });
    }

    const existing = await getProductById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await deleteProduct(id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
