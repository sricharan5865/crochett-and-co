"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ShoppingBag, Heart, MessageCircle, Star } from "lucide-react";
import { type Product } from "@/lib/data/products";
import { useCartStore } from "@/lib/store/cart-store";
import { useWishlistStore } from "@/lib/store/wishlist-store";
import { generateProductInquiry } from "@/lib/whatsapp";

const categoryGradients: Record<string, string> = {
  "crochet-bouquets": "from-rose-pink/30 via-lavender/20 to-rose-pink-light/30",
  "crochet-flowers": "from-sunflower/20 via-rose-pink/20 to-sage/20",
  "lavender-collections": "from-lavender/30 via-lavender-light/20 to-rose-pink/20",
  "hair-clips": "from-rose-pink/20 via-sunflower/20 to-lavender/20",
  "crochet-bags": "from-sage/20 via-cream-dark/30 to-sage-light/20",
  keychains: "from-sunflower/25 via-rose-pink/20 to-lavender/20",
  "gift-hampers": "from-lavender/25 via-rose-pink/25 to-sunflower/20",
  "custom-orders": "from-sunflower/20 via-sage/20 to-lavender/20",
  tulips: "from-rose-pink/25 via-rose-pink-light/20 to-cream/30",
  roses: "from-rose-pink-dark/25 via-rose-pink/25 to-rose-pink-light/20",
  sunflowers: "from-sunflower/30 via-sunflower-light/25 to-cream/20",
  "seasonal-collections": "from-sage/20 via-sunflower/20 to-rose-pink/20",
};

const categoryEmojis: Record<string, string> = {
  "crochet-bouquets": "💐",
  "crochet-flowers": "🌸",
  "lavender-collections": "💜",
  "hair-clips": "🎀",
  "crochet-bags": "👜",
  keychains: "🔑",
  "gift-hampers": "🎁",
  "custom-orders": "✨",
  tulips: "🌷",
  roses: "🌹",
  sunflowers: "🌻",
  "seasonal-collections": "🍂",
};

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isWishlisted = useWishlistStore((s) => s.items.includes(product.id));

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const gradient = categoryGradients[product.category] || "from-rose-pink/20 to-lavender/20";
  const emoji = categoryEmojis[product.category] || "🌸";

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-rose-pink/10 transition-shadow duration-300 border border-border/50"
    >
      {/* Image Display */}
      <Link href={`/shop/${product.slug}`} className="block relative">
        <div
          className={`relative h-52 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}
        >
          {product.images && product.images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.name}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="text-6xl group-hover:scale-110 transition-transform duration-500">
              {emoji}
            </span>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isNew && (
              <span className="px-2.5 py-0.5 bg-sage text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                New
              </span>
            )}
            {product.isBestseller && (
              <span className="px-2.5 py-0.5 bg-sunflower text-foreground text-[10px] font-bold rounded-full">
                ⭐ Bestseller
              </span>
            )}
            {product.isTrending && (
              <span className="px-2.5 py-0.5 bg-lavender text-foreground text-[10px] font-bold rounded-full">
                🔥 Trending
              </span>
            )}
          </div>

          {/* Discount Badge */}
          {discount > 0 && (
            <span className="absolute top-3 right-3 px-2.5 py-0.5 bg-rose-pink text-white text-[10px] font-bold rounded-full">
              {discount}% OFF
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link href={`/shop/${product.slug}`}>
          <h3 className="font-heading text-base font-semibold text-foreground line-clamp-1 group-hover:text-rose-pink transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i < Math.floor(product.rating)
                  ? "fill-sunflower text-sunflower"
                  : "fill-muted text-muted"
              }`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">
            ({product.reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg font-bold text-foreground">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ₹{product.originalPrice.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
          <button
            onClick={() =>
              addItem({
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
              })
            }
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-pink text-white text-sm font-medium rounded-xl hover:bg-rose-pink-dark transition-colors"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag className="w-4 h-4" />
            Add to Cart
          </button>

          <button
            onClick={() => toggleWishlist(product.id)}
            className={`p-2 rounded-xl border transition-colors ${
              isWishlisted
                ? "bg-rose-pink/10 border-rose-pink/30 text-rose-pink"
                : "border-border/50 text-muted-foreground hover:text-rose-pink hover:border-rose-pink/30"
            }`}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={`w-4 h-4 ${isWishlisted ? "fill-rose-pink" : ""}`}
            />
          </button>

          <a
            href={generateProductInquiry(product)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl border border-border/50 text-green-600 hover:bg-green-50 hover:border-green-200 transition-colors"
            aria-label="Inquire on WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
