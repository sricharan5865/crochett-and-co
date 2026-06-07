import { NextResponse } from 'next/server';
import { getProducts, saveProduct } from '@/lib/db';
import type { Product } from '@/lib/data/products';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
  try {
    const list = await getProducts();
    return NextResponse.json(list);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAuth = await isAuthenticated(req);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    
    // Required fields check (make sure name is not empty or whitespace)
    if (!payload.id || !payload.name || !payload.name.trim() || !payload.slug || !payload.category || payload.price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Negative price check
    if (typeof payload.price !== 'number' || payload.price < 0) {
      return NextResponse.json({ error: 'Price cannot be negative' }, { status: 400 });
    }

    const list = await getProducts();
    
    // Duplicate slug check
    const dupSlug = list.find(p => p.slug === payload.slug && p.id !== payload.id);
    if (dupSlug) {
      return NextResponse.json({ error: 'Duplicate slug' }, { status: 409 });
    }

    // Build sanitised product
    const product: Product = {
      id: payload.id,
      name: payload.name,
      slug: payload.slug,
      description: payload.description || '',
      shortDescription: payload.shortDescription || '',
      price: payload.price,
      originalPrice: payload.originalPrice,
      category: payload.category,
      occasion: payload.occasion || [],
      images: payload.images || [],
      colors: payload.colors || [],
      rating: payload.rating !== undefined ? payload.rating : 5,
      reviewCount: payload.reviewCount !== undefined ? payload.reviewCount : 0,
      inStock: payload.inStock !== undefined ? payload.inStock : true,
      isNew: payload.isNew !== undefined ? payload.isNew : false,
      isBestseller: payload.isBestseller !== undefined ? payload.isBestseller : false,
      isTrending: payload.isTrending !== undefined ? payload.isTrending : false,
      isFeatured: payload.isFeatured !== undefined ? payload.isFeatured : false,
      customizable: payload.customizable !== undefined ? payload.customizable : true,
      tags: payload.tags || [],
    };

    await saveProduct(product);
    return NextResponse.json(product, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
