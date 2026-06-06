import type { Metadata } from "next";
import Link from "next/link";
import { categories } from "@/lib/data/categories";
import { getProductsByCategory } from "@/lib/data/products";

export const metadata: Metadata = {
  title: "Categories — Crochett & Co",
  description:
    "Browse all categories of handmade crochet products — bouquets, flowers, bags, keychains, gift hampers, and more.",
  openGraph: {
    title: "Categories — Crochett & Co",
    description:
      "Browse all categories of handmade crochet products — bouquets, flowers, bags, keychains, gift hampers, and more.",
  },
};

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-br from-lavender/10 via-rose-pink/10 to-sunflower/10 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-foreground">
            Shop by Category 🎀
          </h1>
          <p className="mt-3 text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Find the perfect handmade crochet creation for every occasion
          </p>
        </div>
      </section>

      {/* Category Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
          {categories.map((category) => {
            const actualCount = getProductsByCategory(category.slug).length;
            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group block"
              >
                <div
                  className={`relative rounded-2xl bg-gradient-to-br ${category.gradient} border border-border/30 p-6 sm:p-8 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-rose-pink/10 hover:-translate-y-1`}
                >
                  {/* Decorative circles */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/20 blur-xl" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/15 blur-lg" />

                  {/* Icon */}
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>

                  {/* Name */}
                  <h2 className="font-heading text-lg font-semibold text-foreground group-hover:text-rose-pink transition-colors">
                    {category.name}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                    {category.description}
                  </p>

                  {/* Product Count */}
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full text-xs font-medium text-foreground">
                    {actualCount > 0
                      ? `${actualCount} product${actualCount !== 1 ? "s" : ""}`
                      : "Coming soon"}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
