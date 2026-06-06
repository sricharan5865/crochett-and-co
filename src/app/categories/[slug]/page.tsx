import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, getCategoryBySlug } from "@/lib/data/categories";
import { getProducts } from "@/lib/db";
import CategoryProductGrid from "@/components/products/category-product-grid";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const products = await getProducts();
  const categoryProducts = products.filter((p) => p.category === slug);
  let category = categories.find((c) => c.slug === slug);

  if (!category && categoryProducts.length > 0) {
    category = {
      id: slug,
      name: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      slug: slug,
      description: `Browse our collection of ${slug.replace(/-/g, ' ')}`,
      icon: "🌸",
      productCount: categoryProducts.length,
      gradient: "from-rose-pink/20 to-lavender/20"
    };
  }

  if (!category) {
    return { title: "Category Not Found — Crochett & Co" };
  }

  return {
    title: `${category.name} — Crochett & Co`,
    description: category.description,
    openGraph: {
      title: `${category.name} — Crochett & Co`,
      description: category.description,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const products = await getProducts();
  const categoryProducts = products.filter((p) => p.category === slug);
  let category = categories.find((c) => c.slug === slug);

  if (!category && categoryProducts.length > 0) {
    category = {
      id: slug,
      name: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      slug: slug,
      description: `Browse our collection of ${slug.replace(/-/g, ' ')}`,
      icon: "🌸",
      productCount: categoryProducts.length,
      gradient: "from-rose-pink/20 to-lavender/20"
    };
  }

  if (!category) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Category Header */}
      <section
        className={`bg-gradient-to-br ${category.gradient} py-12 md:py-16`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6"
            aria-label="Breadcrumb"
          >
            <Link
              href="/"
              className="hover:text-rose-pink transition-colors"
            >
              Home
            </Link>
            <span>/</span>
            <Link
              href="/categories"
              className="hover:text-rose-pink transition-colors"
            >
              Categories
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">
              {category.name}
            </span>
          </nav>

          <div className="text-center">
            <span className="text-6xl mb-4 block">{category.icon}</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-foreground">
              {category.name}
            </h1>
            <p className="mt-3 text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
              {category.description}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {categoryProducts.length} product
              {categoryProducts.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        {categoryProducts.length > 0 ? (
          <CategoryProductGrid products={categoryProducts} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl mb-4">{category.icon}</span>
            <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
              Coming Soon!
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              We&apos;re crafting beautiful {category.name.toLowerCase()} for
              you. Check back soon or browse our other collections!
            </p>
            <Link
              href="/shop"
              className="px-6 py-2.5 text-sm font-medium bg-rose-pink text-white rounded-xl hover:bg-rose-pink-dark transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
