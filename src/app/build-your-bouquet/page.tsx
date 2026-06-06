"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { generateBouquetOrderMessage } from "@/lib/whatsapp";
import BouquetCanvas3D from "@/components/bouquet-builder/bouquet-canvas-3d";
import {
  Plus,
  Minus,
  ShoppingBag,
  MessageCircle,
  Save,
  Check,
  Sparkles,
  Gift,
  ArrowRight,
} from "lucide-react";

/* ─── Data ───────────────────────────────────────────────────────────── */

interface Flower {
  id: string;
  name: string;
  emoji: string;
  price: number;
}

const FLOWERS: Flower[] = [
  { id: "roses", name: "Roses", emoji: "🌹", price: 80 },
  { id: "tulips", name: "Tulips", emoji: "🌷", price: 70 },
  { id: "sunflowers", name: "Sunflowers", emoji: "🌻", price: 90 },
  { id: "daisies", name: "Daisies", emoji: "🌼", price: 60 },
  { id: "lavender", name: "Lavender", emoji: "💜", price: 50 },
  { id: "lilies", name: "Lilies", emoji: "🪷", price: 85 },
  { id: "babys-breath", name: "Baby's Breath", emoji: "🤍", price: 40 },
  { id: "carnations", name: "Carnations", emoji: "🌺", price: 65 },
];

interface WrappingOption {
  id: string;
  name: string;
  price: number;
  description: string;
}

const WRAPPING_OPTIONS: WrappingOption[] = [
  { id: "standard", name: "Standard", price: 0, description: "Simple & elegant tissue wrap" },
  { id: "kraft", name: "Premium Kraft", price: 99, description: "Rustic kraft paper with twine" },
  { id: "luxury", name: "Luxury Box", price: 249, description: "Velvet-lined presentation box" },
  { id: "satin", name: "Satin Ribbon", price: 149, description: "Wrapped with premium satin ribbon" },
];

const STORAGE_KEY = "crochett-bouquet-design";

/* ─── Component ──────────────────────────────────────────────────────── */

export default function BuildYourBouquetPage() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [wrapping, setWrapping] = useState("standard");
  const [personalNote, setPersonalNote] = useState("");
  const [savedToast, setSavedToast] = useState(false);

  // Load saved design on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.quantities) setQuantities(data.quantities);
        if (data.wrapping) setWrapping(data.wrapping);
        if (data.personalNote) setPersonalNote(data.personalNote);
      }
    } catch {
      // ignore
    }
  }, []);

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

  const selectedFlowers = FLOWERS.filter((f) => (quantities[f.id] || 0) > 0);
  const totalStems = Object.values(quantities).reduce((s, q) => s + q, 0);

  const flowersSubtotal = selectedFlowers.reduce(
    (sum, f) => sum + f.price * (quantities[f.id] || 0),
    0
  );
  const wrappingPrice =
    WRAPPING_OPTIONS.find((w) => w.id === wrapping)?.price || 0;
  const totalPrice = flowersSubtotal + wrappingPrice;
  const wrappingLabel =
    WRAPPING_OPTIONS.find((w) => w.id === wrapping)?.name || "Standard";

  const handleSaveDesign = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ quantities, wrapping, personalNote })
      );
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleOrderOnWhatsApp = () => {
    const link = generateBouquetOrderMessage({
      flowers: selectedFlowers.map((f) => ({
        name: f.name,
        quantity: quantities[f.id] || 0,
        price: f.price,
      })),
      wrapping: `${wrappingLabel}${wrappingPrice > 0 ? ` (+₹${wrappingPrice})` : ""}`,
      totalPrice,
      note: personalNote || undefined,
    });
    window.open(link, "_blank", "noopener,noreferrer");
  };

  /* Build preview emojis */
  const previewEmojis: string[] = [];
  selectedFlowers.forEach((f) => {
    const qty = quantities[f.id] || 0;
    for (let i = 0; i < Math.min(qty, 6); i++) {
      previewEmojis.push(f.emoji);
    }
  });

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
          Build Your Own Bouquet{" "}
          <span className="inline-block animate-bounce">💐</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-3 max-w-lg text-muted-foreground"
        >
          Handpick your favourite stems, choose a wrapping style, and we&apos;ll
          craft it with love.
        </motion.p>
      </div>

      {/* Two-column layout */}
      <div className="mx-auto max-w-7xl px-4 pb-20 lg:grid lg:grid-cols-[1fr_400px] lg:gap-10">
        {/* LEFT COLUMN */}
        <div className="space-y-10">
          {/* ── Flower cards ── */}
          <div>
            <h2 className="font-heading mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Sparkles className="size-5 text-rose-pink" />
              Choose Your Flowers
            </h2>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06 } },
              }}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
            >
              {FLOWERS.map((flower) => {
                const qty = quantities[flower.id] || 0;
                const isSelected = qty > 0;
                return (
                  <motion.div
                    key={flower.id}
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
                    {/* Badge when selected */}
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

                    <span className="text-4xl leading-none">{flower.emoji}</span>
                    <span className="text-sm font-medium text-foreground">
                      {flower.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ₹{flower.price}/stem
                    </span>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Remove one ${flower.name}`}
                        onClick={() => updateQuantity(flower.id, -1)}
                        disabled={qty === 0}
                        className="flex size-7 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-rose-pink/10 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums text-foreground">
                        {qty}
                      </span>
                      <button
                        type="button"
                        aria-label={`Add one ${flower.name}`}
                        onClick={() => updateQuantity(flower.id, 1)}
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

          {/* ── Gift wrapping ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="font-heading mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Gift className="size-5 text-sunflower" />
              Gift Wrapping
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {WRAPPING_OPTIONS.map((opt) => {
                const isActive = wrapping === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                      isActive
                        ? "border-rose-pink bg-rose-pink/5 shadow-sm"
                        : "border-border bg-card hover:border-rose-pink-light"
                    }`}
                  >
                    <input
                      type="radio"
                      name="wrapping"
                      value={opt.id}
                      checked={isActive}
                      onChange={() => setWrapping(opt.id)}
                      className="mt-1 accent-rose-pink"
                    />
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        {opt.name}
                      </span>
                      {opt.price > 0 && (
                        <span className="ml-1.5 text-xs text-rose-pink">
                          +₹{opt.price}
                        </span>
                      )}
                      {opt.price === 0 && (
                        <span className="ml-1.5 text-xs text-sage">Free</span>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {opt.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN — Summary */}
        <motion.aside
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-10 lg:sticky lg:top-24 lg:mt-0 lg:self-start"
        >
          <div className="rounded-3xl border border-border bg-card p-6 shadow-lg shadow-rose-pink/5">
            {/* 3D Visualizer Preview */}
            <div className="mb-6">
              <BouquetCanvas3D quantities={quantities} wrapping={wrapping} />
            </div>

            <h3 className="font-heading text-center text-lg font-semibold text-foreground">
              Your Bouquet
            </h3>
            <p className="mb-4 text-center text-xs text-muted-foreground">
              {totalStems > 0
                ? `${totalStems} stem${totalStems !== 1 ? "s" : ""} selected`
                : "Select flowers to begin"}
            </p>

            {/* Itemized list */}
            {selectedFlowers.length > 0 && (
              <div className="mb-4 space-y-2">
                {selectedFlowers.map((f) => {
                  const qty = quantities[f.id] || 0;
                  return (
                    <div
                      key={f.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-foreground">
                        {f.emoji} {f.name} × {qty}
                      </span>
                      <span className="font-medium text-foreground">
                        ₹{(f.price * qty).toLocaleString("en-IN")}
                      </span>
                    </div>
                  );
                })}
                {/* Wrapping line */}
                <div className="flex items-center justify-between border-t border-dashed border-border pt-2 text-sm">
                  <span className="text-muted-foreground">
                    🎀 {wrappingLabel}
                  </span>
                  <span className="font-medium text-foreground">
                    {wrappingPrice > 0
                      ? `₹${wrappingPrice.toLocaleString("en-IN")}`
                      : "Free"}
                  </span>
                </div>
                {/* Total */}
                <div className="flex items-center justify-between border-t border-border pt-2 text-base font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-rose-pink">
                    ₹{totalPrice.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            )}

            {/* Personal note */}
            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Personal Note (optional)
              </label>
              <Textarea
                placeholder="Write a heartfelt message to go with the bouquet…"
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                className="min-h-20 rounded-xl border-border bg-cream/50 text-sm"
                maxLength={300}
              />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">
                {personalNote.length}/300
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                disabled={selectedFlowers.length === 0}
                onClick={handleOrderOnWhatsApp}
                className="h-11 w-full gap-2 rounded-xl bg-sage text-white hover:bg-sage-dark"
              >
                <MessageCircle className="size-4" />
                Order on WhatsApp
                <ArrowRight className="size-4" />
              </Button>

              <Button
                variant="outline"
                onClick={handleSaveDesign}
                disabled={selectedFlowers.length === 0}
                className="h-10 w-full gap-2 rounded-xl"
              >
                {savedToast ? (
                  <>
                    <Check className="size-4 text-sage" />
                    Design Saved!
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Save Design
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
