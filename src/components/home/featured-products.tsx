"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/products/product-card";
import type { Product } from "@/lib/data/products";

export default function FeaturedProducts({ initialProducts }: { initialProducts: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [products] = useState<Product[]>(initialProducts);
  const featured = products.filter((p) => p.isFeatured);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
          Featured Collection
        </h2>
        <div className="mt-3 flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-rose-pink/30" />
          <span className="text-rose-pink text-lg">🌸</span>
          <div className="h-px w-12 bg-rose-pink/30" />
        </div>
        <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
          Our most loved handmade crochet creations, picked just for you.
        </p>
      </motion.div>

      {/* Carousel */}
      <div className="relative">
        {/* Scroll Buttons */}
        <button
          onClick={() => scroll("left")}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-rose-pink hover:text-white transition-colors hidden lg:flex"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-rose-pink hover:text-white transition-colors hidden lg:flex"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {featured.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="min-w-[280px] sm:min-w-[300px] snap-start"
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
