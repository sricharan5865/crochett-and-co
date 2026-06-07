"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Star,
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  MessageCircle,
  Paintbrush,
  ChevronRight,
  Truck,
  Sparkles,
  Droplets,
} from "lucide-react";
import { type Product } from "@/lib/data/products";
import { useCartStore } from "@/lib/store/cart-store";
import { useWishlistStore } from "@/lib/store/wishlist-store";
import { generateProductInquiry } from "@/lib/whatsapp";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import ProductCard from "@/components/products/product-card";

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

const colorSwatchMap: Record<string, string> = {
  Red: "#DC2626",
  "Deep Red": "#991B1B",
  Pink: "#F28AAE",
  "Soft Pink": "#F9B8CD",
  "Blush Pink": "#FBCFE8",
  "Deep Pink": "#E0638E",
  Yellow: "#F6C445",
  Purple: "#9333EA",
  Lavender: "#CDB4DB",
  White: "#FAFAFA",
  Green: "#8FAE8A",
  "Sage Green": "#8FAE8A",
  "Green Stems": "#6B8F65",
  "Brown Center": "#92400E",
  Cream: "#FFF7F2",
  Beige: "#F5E6D8",
  Rainbow: "linear-gradient(90deg, #DC2626, #F6C445, #8FAE8A, #3B82F6, #9333EA)",
  "Custom School Colors": "linear-gradient(135deg, #F28AAE, #CDB4DB, #F6C445)",
  "Your Choice": "linear-gradient(135deg, #F28AAE, #8FAE8A, #F6C445, #CDB4DB)",
  "Pink & Lavender": "linear-gradient(90deg, #F28AAE, #CDB4DB)",
  "Blue & Yellow": "linear-gradient(90deg, #3B82F6, #F6C445)",
  Various: "linear-gradient(90deg, #8FAE8A, #F28AAE, #F6C445)",
};

interface ProductDetailProps {
  product: Product;
  relatedProducts: Product[];
  categoryName: string;
}

export default function ProductDetail({
  product,
  relatedProducts,
  categoryName,
}: ProductDetailProps) {
  const [selectedColor, setSelectedColor] = useState(product.colors[0] ?? "");
  const [quantity, setQuantity] = useState(1);

  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isWishlisted = useWishlistStore((s) => s.items.includes(product.id));

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  const gradient =
    categoryGradients[product.category] || "from-rose-pink/20 to-lavender/20";
  const emoji = categoryEmojis[product.category] || "🌸";

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        color: selectedColor,
      });
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 md:mb-8 overflow-x-auto"
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            className="hover:text-rose-pink transition-colors whitespace-nowrap"
          >
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link
            href="/shop"
            className="hover:text-rose-pink transition-colors whitespace-nowrap"
          >
            Shop
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link
            href={`/categories/${product.category}`}
            className="hover:text-rose-pink transition-colors whitespace-nowrap"
          >
            {categoryName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-foreground font-medium truncate">
            {product.name}
          </span>
        </motion.nav>

        {/* Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Image Area — 60% */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3"
          >
            <div
              className={`relative aspect-square sm:aspect-[4/3] rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}
            >
              {product.images && product.images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-[120px] sm:text-[160px] md:text-[200px] select-none">
                  {emoji}
                </span>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {!product.inStock && (
                  <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                    Out of Stock
                  </span>
                )}
                {product.isNew && (
                  <span className="px-3 py-1 bg-sage text-white text-xs font-bold rounded-full uppercase tracking-wider">
                    New
                  </span>
                )}
                {product.isBestseller && (
                  <span className="px-3 py-1 bg-sunflower text-foreground text-xs font-bold rounded-full">
                    ⭐ Bestseller
                  </span>
                )}
                {product.isTrending && (
                  <span className="px-3 py-1 bg-lavender text-foreground text-xs font-bold rounded-full">
                    🔥 Trending
                  </span>
                )}
              </div>

              {discount > 0 && (
                <span className="absolute top-4 right-4 px-3 py-1 bg-rose-pink text-white text-xs font-bold rounded-full">
                  {discount}% OFF
                </span>
              )}

              {/* Wishlist */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`absolute bottom-4 right-4 p-3 rounded-full shadow-lg transition-all ${
                  isWishlisted
                    ? "bg-rose-pink text-white"
                    : "bg-white/80 backdrop-blur-sm text-muted-foreground hover:text-rose-pink"
                }`}
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                <Heart
                  className={`w-5 h-5 ${isWishlisted ? "fill-white" : ""}`}
                />
              </button>
            </div>
          </motion.div>

          {/* Product Info — 40% */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2 flex flex-col"
          >
            {/* Name */}
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? "fill-sunflower text-sunflower"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-3xl font-bold text-foreground">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  ₹{product.originalPrice.toLocaleString("en-IN")}
                </span>
              )}
              {discount > 0 && (
                <span className="text-sm font-semibold text-sage-dark">
                  Save {discount}%
                </span>
              )}
            </div>

            {/* Short Description */}
            <p className="text-muted-foreground text-sm mt-4 leading-relaxed">
              {product.shortDescription}
            </p>

            {/* Color Selector */}
            {product.colors.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Color:{" "}
                  <span className="text-muted-foreground font-normal">
                    {selectedColor}
                  </span>
                </h3>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {product.colors.map((color) => {
                    const bg = colorSwatchMap[color] ?? "#D1D5DB";
                    const isGradient = bg.startsWith("linear");
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-9 h-9 rounded-full border-2 transition-all ${
                          selectedColor === color
                            ? "border-rose-pink scale-110 shadow-md"
                            : "border-border/50 hover:border-rose-pink/50"
                        }`}
                        style={{
                          background: isGradient ? bg : bg,
                          ...(isGradient ? {} : { backgroundColor: bg }),
                        }}
                        aria-label={`Select ${color}`}
                        title={color}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-foreground mb-3">
                Quantity
              </h3>
              <div className="inline-flex items-center gap-0 border border-border/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3 hover:bg-muted/50 transition-colors"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-semibold tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-3 hover:bg-muted/50 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-8">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="flex items-center justify-center gap-2.5 py-3.5 px-6 bg-rose-pink text-white font-semibold rounded-xl hover:bg-rose-pink-dark transition-colors shadow-md shadow-rose-pink/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-5 h-5" />
                {!product.inStock ? "Out of Stock" : `Add to Cart — ₹${(product.price * quantity).toLocaleString("en-IN")}`}
              </button>

              <Link
                href="/custom-orders"
                className="flex items-center justify-center gap-2.5 py-3.5 px-6 border-2 border-rose-pink/30 text-rose-pink font-semibold rounded-xl hover:bg-rose-pink/5 transition-colors active:scale-[0.98]"
              >
                <Paintbrush className="w-5 h-5" />
                Customize This Design
              </Link>

              <a
                href={generateProductInquiry(product)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 py-3.5 px-6 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors active:scale-[0.98]"
              >
                <MessageCircle className="w-5 h-5" />
                Order on WhatsApp
              </a>
            </div>

            {/* Accordion */}
            <div className="mt-8 border-t border-border/50 pt-6">
              <Accordion>
                <AccordionItem value="description">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-rose-pink" />
                      Description
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                    {product.customizable && (
                      <p className="mt-3 text-sm text-sage-dark font-medium">
                        ✨ This product is customizable! Contact us for
                        personalization options.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="care">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-rose-pink" />
                      Care Instructions
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="text-muted-foreground space-y-2 text-sm">
                      <li>
                        • Gently dust with a soft brush or use a hairdryer on
                        cool setting
                      </li>
                      <li>• Avoid direct sunlight for prolonged periods</li>
                      <li>
                        • Store in a cool, dry place when not on display
                      </li>
                      <li>
                        • Spot clean with mild soap and water if needed
                      </li>
                      <li>
                        • Handle with care — each piece is handmade with love
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="shipping">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-rose-pink" />
                      Shipping Info
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="text-muted-foreground space-y-2 text-sm">
                      <li>• Free shipping on orders above ₹999</li>
                      <li>
                        • Standard delivery: 5–7 business days across India
                      </li>
                      <li>• Express delivery: 2–3 business days (₹149 extra)</li>
                      <li>
                        • Each item is carefully packaged to ensure safe
                        delivery
                      </li>
                      <li>
                        • Custom orders may require 7–10 additional working
                        days
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </motion.div>
        </div>

        {/* You May Also Like */}
        {relatedProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 md:mt-20"
          >
            <h2 className="font-heading text-2xl font-bold text-foreground mb-6 md:mb-8">
              You May Also Like 💕
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </main>
  );
}
