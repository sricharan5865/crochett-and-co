import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/db";
import { getCategoryBySlug } from "@/lib/data/categories";
import ProductDetail from "@/components/products/product-detail";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found — Crochett & Co" };
  }

  const category = getCategoryBySlug(product.category);

  return {
    title: `${product.name} — Crochett & Co`,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name} — Crochett & Co`,
      description: product.shortDescription,
      type: "website",
    },
    keywords: [
      ...product.tags,
      "crochet",
      "handmade",
      category?.name ?? "",
    ].filter(Boolean),
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const products = await getProducts();

  // Get related products from same category, excluding current
  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // If not enough in same category, fill with other products
  const fillerCount = 4 - relatedProducts.length;
  if (fillerCount > 0) {
    const fillers = products
      .filter(
        (p) =>
          p.id !== product.id &&
          !relatedProducts.some((r) => r.id === p.id)
      )
      .slice(0, fillerCount);
    relatedProducts.push(...fillers);
  }

  const category = getCategoryBySlug(product.category);

  return (
    <ProductDetail
      product={product}
      relatedProducts={relatedProducts}
      categoryName={category?.name ?? "Shop"}
    />
  );
}
