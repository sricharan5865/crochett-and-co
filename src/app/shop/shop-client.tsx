"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SlidersHorizontal, X, ChevronDown, Search, PackageOpen } from "lucide-react";
import { categories } from "@/lib/data/categories";
import { occasions } from "@/lib/data/categories";
import ProductCard from "@/components/products/product-card";
import type { Product } from "@/lib/data/products";

type SortOption = "newest" | "price-low" | "price-high" | "popular" | "rating";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low → High" },
  { value: "price-high", label: "Price: High → Low" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Best Rated" },
];

export default function ShopClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products] = useState<Product[]>(initialProducts);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleCategory = useCallback((slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  }, []);

  const toggleOccasion = useCallback((slug: string) => {
    setSelectedOccasions((prev) =>
      prev.includes(slug) ? prev.filter((o) => o !== slug) : [...prev, slug]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedOccasions([]);
    setPriceMin("");
    setPriceMax("");
    setSearchQuery("");
  }, []);

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedOccasions.length > 0 ||
    priceMin !== "" ||
    priceMax !== "" ||
    searchQuery !== "";

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }

    // Occasion filter
    if (selectedOccasions.length > 0) {
      result = result.filter((p) =>
        p.occasion.some((o) => selectedOccasions.includes(o))
      );
    }

    // Price filter
    const min = priceMin ? parseFloat(priceMin) : 0;
    const max = priceMax ? parseFloat(priceMax) : Infinity;
    if (priceMin || priceMax) {
      result = result.filter((p) => p.price >= min && p.price <= max);
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
    }

    return result;
  }, [products, selectedCategories, selectedOccasions, priceMin, priceMax, sortBy, searchQuery]);

  const filterContent = (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-border/50 bg-card focus:outline-none focus:ring-2 focus:ring-rose-pink/30 focus:border-rose-pink transition-colors"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Category</h3>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <label
              key={cat.slug}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.slug)}
                onChange={() => toggleCategory(cat.slug)}
                className="w-4 h-4 rounded border-border text-rose-pink focus:ring-rose-pink/30 accent-rose-pink"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {cat.icon} {cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Occasions */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Occasion</h3>
        <div className="space-y-2">
          {occasions.map((occ) => (
            <label
              key={occ.slug}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedOccasions.includes(occ.slug)}
                onChange={() => toggleOccasion(occ.slug)}
                className="w-4 h-4 rounded border-border text-rose-pink focus:ring-rose-pink/30 accent-rose-pink"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {occ.icon} {occ.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">
          Price Range (₹)
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder="Min"
            min={0}
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-border/50 bg-card focus:outline-none focus:ring-2 focus:ring-rose-pink/30 focus:border-rose-pink transition-colors"
          />
          <span className="text-muted-foreground text-sm">—</span>
          <input
            type="number"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder="Max"
            min={0}
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-border/50 bg-card focus:outline-none focus:ring-2 focus:ring-rose-pink/30 focus:border-rose-pink transition-colors"
          />
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full py-2.5 text-sm font-medium text-rose-pink border border-rose-pink/30 rounded-xl hover:bg-rose-pink/5 transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-rose-pink/10 via-lavender/10 to-sunflower/10 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-foreground"
          >
            Our Collection Our Shop 🌸
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-3 text-muted-foreground text-base sm:text-lg max-w-xl mx-auto"
          >
            {filteredAndSortedProducts.length} handmade treasures waiting to be loved
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 bg-card rounded-2xl border border-border/50 p-5 shadow-sm">
              <h2 className="font-heading font-semibold text-foreground text-lg mb-5">
                Filters
              </h2>
              {filterContent}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-6">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-card border border-border/50 rounded-xl hover:border-rose-pink/30 transition-colors"
                aria-label="Open filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="w-5 h-5 flex items-center justify-center bg-rose-pink text-white text-[10px] font-bold rounded-full">
                    {selectedCategories.length + selectedOccasions.length + (priceMin || priceMax ? 1 : 0)}
                  </span>
                )}
              </button>

              {/* Sort */}
              <div className="relative ml-auto">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    Sort by:
                  </span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="appearance-none pl-3 pr-8 py-2.5 text-sm bg-card border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-pink/30 focus:border-rose-pink cursor-pointer transition-colors"
                      aria-label="Sort products"
                    >
                      {sortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {filteredAndSortedProducts.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: { staggerChildren: 0.07 },
                  },
                }}
              >
                {filteredAndSortedProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={{
                      hidden: { opacity: 0, y: 24 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
                    }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 bg-rose-pink/10 rounded-full flex items-center justify-center mb-5">
                  <PackageOpen className="w-9 h-9 text-rose-pink" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                  No products found
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm mb-5">
                  We couldn&apos;t find any products matching your filters. Try adjusting your
                  criteria or browse our full collection.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2.5 text-sm font-medium bg-rose-pink text-white rounded-xl hover:bg-rose-pink-dark transition-colors"
                >
                  Clear All Filters
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-card z-50 lg:hidden shadow-2xl overflow-y-auto"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading font-semibold text-foreground text-lg">
                    Filters
                  </h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
                    aria-label="Close filters"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {filterContent}
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full mt-6 py-3 text-sm font-semibold bg-rose-pink text-white rounded-xl hover:bg-rose-pink-dark transition-colors"
                >
                  Show {filteredAndSortedProducts.length} Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
