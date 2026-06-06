"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ShoppingBag, Minus, Plus, X, ArrowLeft, MessageCircle } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { generateWhatsAppLink } from "@/lib/whatsapp";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);

  const subtotal = getTotal();
  const itemCount = getItemCount();
  const deliveryFee = subtotal >= 999 ? 0 : 49;
  const total = subtotal + deliveryFee;

  function handleWhatsAppOrder() {
    const itemLines = items
      .map(
        (item) =>
          `• ${item.name} × ${item.quantity} — ₹${(item.price * item.quantity).toLocaleString("en-IN")}`
      )
      .join("\n");

    const message = `Hello Crochett & Co! 🌸

I'd like to place an order:

${itemLines}

Subtotal: ₹${subtotal.toLocaleString("en-IN")}
Delivery: ${deliveryFee === 0 ? "Free ✨" : `₹${deliveryFee}`}
*Total: ₹${total.toLocaleString("en-IN")}*

Please confirm availability and share payment details.

Thank you! 💐`;

    window.open(generateWhatsAppLink(message), "_blank");
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <div className="text-8xl mb-6">🧺</div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
            Your Cart is Empty
          </h1>
          <p className="text-muted-foreground mb-8">
            Looks like you haven&apos;t added any handcrafted goodies yet. Explore our
            collection and find something you love!
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-rose-pink text-white font-medium rounded-full hover:bg-rose-pink-dark transition-colors shadow-lg shadow-rose-pink/25"
          >
            <ShoppingBag className="w-5 h-5" />
            Browse Collection
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <section className="py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
            Your Cart 🛒
          </h1>
          <p className="text-muted-foreground mt-1">
            {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2 space-y-4"
          >
            {items.map((item) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                layout
                className="bg-card rounded-2xl border border-border/50 p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* Product Image Placeholder */}
                  <Link
                    href={`/shop/${item.slug}`}
                    className="shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gradient-to-br from-rose-pink/20 via-lavender/15 to-sunflower/15 flex items-center justify-center"
                  >
                    <span className="text-3xl md:text-4xl">🌸</span>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/shop/${item.slug}`}
                        className="font-heading font-semibold text-foreground line-clamp-2 hover:text-rose-pink transition-colors"
                      >
                        {item.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {item.color && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Color: {item.color}
                      </p>
                    )}

                    <div className="flex items-end justify-between mt-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1.5 rounded-lg hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 rounded-lg hover:bg-background transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <p className="font-bold text-foreground">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Order Summary Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm sticky top-24">
              <h2 className="font-heading text-xl font-bold text-foreground mb-5">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="font-medium text-foreground">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span className="font-medium text-foreground">
                    {deliveryFee === 0 ? (
                      <span className="text-sage">Free ✨</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>
                {deliveryFee > 0 && (
                  <p className="text-xs text-sage">
                    Add ₹{(999 - subtotal).toLocaleString("en-IN")} more for free delivery
                  </p>
                )}
                <div className="border-t border-border/50 pt-3 flex justify-between">
                  <span className="font-heading font-bold text-base text-foreground">
                    Total
                  </span>
                  <span className="font-heading font-bold text-lg text-foreground">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleWhatsAppOrder}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 text-white font-medium rounded-full hover:bg-green-700 transition-colors shadow-lg shadow-green-600/25"
                >
                  <MessageCircle className="w-5 h-5" />
                  Order on WhatsApp
                </button>
                <Link
                  href="/shop"
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-rose-pink text-rose-pink font-medium rounded-full hover:bg-rose-pink/5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Continue Shopping
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-5 border-t border-border/50 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span>🧶</span>
                  <span>100% Handmade</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>🎁</span>
                  <span>Gift Wrapped</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>🚚</span>
                  <span>Pan India Delivery</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>💬</span>
                  <span>WhatsApp Support</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
