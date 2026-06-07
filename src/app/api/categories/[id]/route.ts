import { NextResponse } from 'next/server';
import { getCategoryById, saveCategory, deleteCategory, getCategories } from '@/lib/db';
import type { Category } from '@/lib/data/categories';
import { isAuthenticated } from '@/lib/auth';

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: Request, { params }: Params) {
  try {
    const isAuth = await isAuthenticated(req);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await getCategoryById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const payload = await req.json();

    if (payload.name !== undefined && (typeof payload.name !== 'string' || !payload.name.trim())) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }
    if (payload.slug !== undefined && (typeof payload.slug !== 'string' || !payload.slug.trim())) {
      return NextResponse.json({ error: 'Slug cannot be empty' }, { status: 400 });
    }
    if (payload.gradient !== undefined && (typeof payload.gradient !== 'string' || !payload.gradient.trim())) {
      return NextResponse.json({ error: 'Gradient cannot be empty' }, { status: 400 });
    }

    if (payload.slug) {
      const list = await getCategories();
      const conf = list.find(c => c.slug === payload.slug && c.id !== id);
      if (conf) {
        return NextResponse.json({ error: 'Slug conflicts with another category' }, { status: 409 });
      }
    }

    const updated: Category = {
      ...existing,
      ...payload,
      id, // keep original ID
    };

    await saveCategory(updated);
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

    const existing = await getCategoryById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
