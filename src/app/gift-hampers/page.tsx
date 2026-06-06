"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateGiftHamperMessage } from "@/lib/whatsapp";
import {
  Plus,
  Minus,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Gift,
  Heart,
} from "lucide-react";

/* ─── Data ───────────────────────────────────────────────────────────── */

interface HamperItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
}

const HAMPER_ITEMS: HamperItem[] = [
  { id: "crochet-flowers", name: "Crochet Flowers", emoji: "🌸", price: 199 },
  { id: "roses", name: "Roses", emoji: "🌹", price: 149 },
  { id: "chocolates", name: "Chocolates", emoji: "🍫", price: 199 },
  { id: "greeting-card", name: "Greeting Card", emoji: "💌", price: 79 },
  { id: "keychain", name: "Keychain", emoji: "🔑", price: 149 },
  { id: "photo-frame", name: "Photo Frame", emoji: "🖼️", price: 249 },
  { id: "note", name: "Note", emoji: "📝", price: 0 },
  { id: "candle", name: "Candle", emoji: "🕯️", price: 199 },
  { id: "teddy", name: "Teddy", emoji: "🧸", price: 299 },
  { id: "gift-box", name: "Gift Box", emoji: "📦", price: 199 },
];

const OCCASIONS = [
  "Birthday",
  "Anniversary",
  "Valentine's Day",
  "Mother's Day",
  "Father's Day",
  "Graduation",
  "Get Well Soon",
  "Thank You",
  "Just Because",
  "Wedding",
  "Housewarming",
  "Other",
];

/* ─── Component ──────────────────────────────────────────────────────── */

export default function GiftHampersPage() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [recipientName, setRecipientName] = useState("");
  const [occasion, setOccasion] = useState("");

  const updateQuantity = useCallback((id: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        void _;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  }, []);

  const selectedItems = HAMPER_ITEMS.filter((item) => (quantities[item.id] || 0) > 0);
  const totalItems = Object.values(quantities).reduce((s, q) => s + q, 0);

  const totalPrice = selectedItems.reduce(
    (sum, item) => sum + item.price * (quantities[item.id] || 0),
    0
  );

  const handleOrderOnWhatsApp = () => {
    const link = generateGiftHamperMessage({
      items: selectedItems.map((item) => ({
        name: item.name,
        quantity: quantities[item.id] || 0,
      })),
      totalPrice,
      recipientName: recipientName || undefined,
      occasion: occasion || undefined,
    });
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="px-4 pt-12 pb-8 text-center sm:pt-16 sm:pb-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
        >
          Create Your Gift Hamper{" "}
          <span className="inline-block animate-bounce">🎁</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-3 max-w-lg text-muted-foreground"
        >
          Mix and match handpicked items to build the perfect gift hamper for
          someone special.
        </motion.p>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 pb-20 lg:grid lg:grid-cols-[1fr_380px] lg:gap-10">
        {/* ── Items Grid ── */}
        <div>
          <h2 className="font-heading mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Sparkles className="size-5 text-sunflower" />
            Pick Your Items
          </h2>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.05 } },
            }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          >
            {HAMPER_ITEMS.map((item) => {
              const qty = quantities[item.id] || 0;
              const isSelected = qty > 0;
              const isFree = item.price === 0;
              return (
                <motion.div
                  key={item.id}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.95 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className={`group relative flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors ${
                    isSelected
                      ? "border-rose-pink bg-rose-pink/5 shadow-md shadow-rose-pink/10"
                      : "border-border bg-card hover:border-rose-pink-light"
                  }`}
                >
                  {/* Badge */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-rose-pink text-xs font-bold text-white shadow-sm"
                      >
                        {qty}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  <span className="text-3xl leading-none sm:text-4xl">
                    {item.emoji}
                  </span>
                  <span className="text-center text-sm font-medium text-foreground leading-tight">
                    {item.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isFree ? (
                      <span className="font-medium text-sage">Free</span>
                    ) : (
                      `₹${item.price.toLocaleString("en-IN")}`
                    )}
                  </span>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Remove one ${item.name}`}
                      onClick={() => updateQuantity(item.id, -1)}
                      disabled={qty === 0}
                      className="flex size-7 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-rose-pink/10 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold tabular-nums text-foreground">
                      {qty}
                    </span>
                    <button
                      type="button"
                      aria-label={`Add one ${item.name}`}
                      onClick={() => updateQuantity(item.id, 1)}
                      className="flex size-7 items-center justify-center rounded-full border border-rose-pink bg-rose-pink/10 text-rose-pink transition-colors hover:bg-rose-pink hover:text-white"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* ── Summary Panel (sticky) ── */}
        <motion.aside
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-10 lg:sticky lg:top-24 lg:mt-0 lg:self-start"
        >
          <div className="rounded-3xl border border-border bg-card p-6 shadow-lg shadow-rose-pink/5">
            {/* Header decoration */}
            <div className="mb-5 flex items-center justify-center gap-2">
              <Gift className="size-5 text-rose-pink" />
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Your Hamper
              </h3>
            </div>

            {/* Empty state */}
            {selectedItems.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <span className="text-4xl opacity-30">🎁</span>
                <p className="text-sm text-muted-foreground">
                  Start adding items to build your hamper
                </p>
              </div>
            )}

            {/* Selected items */}
            {selectedItems.length > 0 && (
              <div className="mb-5 space-y-2">
                <AnimatePresence mode="popLayout">
                  {selectedItems.map((item) => {
                    const qty = quantities[item.id] || 0;
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-foreground">
                          {item.emoji} {item.name} × {qty}
                        </span>
                        <span className="font-medium text-foreground">
                          {item.price === 0
                            ? "Free"
                            : `₹${(item.price * qty).toLocaleString("en-IN")}`}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Total */}
                <div className="flex items-center justify-between border-t border-border pt-3 text-base font-bold">
                  <span className="text-foreground">
                    Total ({totalItems} item{totalItems !== 1 ? "s" : ""})
                  </span>
                  <span className="text-rose-pink">
                    ₹{totalPrice.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            )}

            {/* Occasion */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                <Heart className="mr-1 inline size-3 text-rose-pink" />
                Occasion
              </label>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none transition-colors focus:border-rose-pink focus:ring-2 focus:ring-rose-pink/20"
                aria-label="Select an occasion"
              >
                <option value="">Select an occasion…</option>
                {OCCASIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient name */}
            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                🎀 Recipient&apos;s Name (optional)
              </label>
              <Input
                placeholder="Who is this gift for?"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* CTA */}
            <Button
              disabled={selectedItems.length === 0}
              onClick={handleOrderOnWhatsApp}
              className="h-11 w-full gap-2 rounded-xl bg-sage text-white hover:bg-sage-dark"
            >
              <MessageCircle className="size-4" />
              Order on WhatsApp
              <ArrowRight className="size-4" />
            </Button>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              We&apos;ll confirm pricing & delivery on WhatsApp 💬
            </p>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
