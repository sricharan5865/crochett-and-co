"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { useWishlistStore } from "@/lib/store/wishlist-store";
import { products } from "@/lib/data/products";
import ProductCard from "@/components/products/product-card";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function WishlistPage() {
  const wishlistIds = useWishlistStore((s) => s.items);
  const wishlisted = products.filter((p) => wishlistIds.includes(p.id));

  if (wishlisted.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <div className="text-8xl mb-6">💕</div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
            Your Wishlist is Empty
          </h1>
          <p className="text-muted-foreground mb-8">
            Save your favourite handcrafted pieces here. Tap the heart on any product
            to add it to your wishlist!
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-rose-pink text-white font-medium rounded-full hover:bg-rose-pink-dark transition-colors shadow-lg shadow-rose-pink/25"
          >
            <Heart className="w-5 h-5" />
            Discover Products
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <section className="py-8 md:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
            Your Wishlist 💕
          </h1>
          <p className="text-muted-foreground mt-1">
            {wishlisted.length} {wishlisted.length === 1 ? "item" : "items"} saved
          </p>
        </motion.div>

        {/* Product Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {wishlisted.map((product) => (
            <motion.div key={product.id} variants={itemVariants}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
