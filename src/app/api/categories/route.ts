import { NextResponse } from 'next/server';
import { getCategories, saveCategory } from '@/lib/db';
import type { Category } from '@/lib/data/categories';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
  try {
    const list = await getCategories();
    return NextResponse.json(list);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAuth = await isAuthenticated(req);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();

    if (!payload.id || typeof payload.id !== 'string' || !payload.id.trim() ||
        !payload.name || typeof payload.name !== 'string' || !payload.name.trim() ||
        !payload.slug || typeof payload.slug !== 'string' || !payload.slug.trim() ||
        !payload.gradient || typeof payload.gradient !== 'string' || !payload.gradient.trim()) {
      return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 });
    }

    const list = await getCategories();

    const dupId = list.find(c => c.id === payload.id);
    if (dupId) {
      return NextResponse.json({ error: 'Duplicate category ID' }, { status: 409 });
    }

    const dupSlug = list.find(c => c.slug === payload.slug);
    if (dupSlug) {
      return NextResponse.json({ error: 'Duplicate slug' }, { status: 409 });
    }

    const category: Category = {
      id: payload.id,
      name: payload.name,
      slug: payload.slug,
      description: payload.description || '',
      icon: payload.icon || '',
      productCount: typeof payload.productCount === 'number' ? payload.productCount : 0,
      gradient: payload.gradient,
    };

    await saveCategory(category);
    return NextResponse.json(category, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
