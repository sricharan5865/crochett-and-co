"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Search, Sparkles } from "lucide-react";

interface GalleryItem {
  id: number;
  category: string;
  emoji: string;
  title: string;
  likes: number;
  gradient: string;
  height: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 1,
    category: "Bouquets",
    emoji: "💐",
    title: "Pastel Meadow Bouquet",
    likes: 145,
    gradient: "from-rose-pink/20 to-lavender/20",
    height: "h-64",
  },
  {
    id: 2,
    category: "Flowers",
    emoji: "🌹",
    title: "Classic Red Rose Stem",
    likes: 98,
    gradient: "from-rose-pink-dark/20 to-rose-pink/25",
    height: "h-80",
  },
  {
    id: 3,
    category: "Accessories",
    emoji: "🎀",
    title: "Daisy Flower Hair Clip",
    likes: 210,
    gradient: "from-sunflower/20 to-rose-pink/20",
    height: "h-60",
  },
  {
    id: 4,
    category: "Custom Orders",
    emoji: "🧸",
    title: "Custom Amigurumi Bear",
    likes: 178,
    gradient: "from-sage/20 to-cream-dark/20",
    height: "h-96",
  },
  {
    id: 5,
    category: "Bouquets",
    emoji: "🌻",
    title: "Golden Sunflower Bouquet",
    likes: 320,
    gradient: "from-sunflower/25 to-sunflower-light/20",
    height: "h-80",
  },
  {
    id: 6,
    category: "Flowers",
    emoji: "🌷",
    title: "Pink Crochet Tulips",
    likes: 112,
    gradient: "from-rose-pink/15 to-cream/30",
    height: "h-64",
  },
  {
    id: 7,
    category: "Accessories",
    emoji: "👜",
    title: "Mini Shell Stitch Tote Bag",
    likes: 245,
    gradient: "from-sage/15 to-lavender/15",
    height: "h-72",
  },
  {
    id: 8,
    category: "Custom Orders",
    emoji: "✨",
    title: "Custom Wedding Flower Set",
    likes: 189,
    gradient: "from-rose-pink/25 to-cream/25",
    height: "h-80",
  },
  {
    id: 9,
    category: "Flowers",
    emoji: "💜",
    title: "English Lavender Stems",
    likes: 156,
    gradient: "from-lavender/25 to-rose-pink/15",
    height: "h-96",
  },
];

const categories = ["All", "Bouquets", "Flowers", "Accessories", "Custom Orders"];

export default function GalleryPage() {
  const [activeTab, setActiveTab] = useState("All");

  const filteredItems = GALLERY_ITEMS.filter(
    (item) => activeTab === "All" || item.category === activeTab
  );

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-rose-pink/10 rounded-full text-rose-pink text-sm font-medium mb-4"
        >
          <Sparkles className="w-4 h-4" />
          Handmade Gallery
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-heading text-4xl sm:text-5xl font-bold text-foreground"
        >
          Gallery 📸
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto"
        >
          Take a look at some of the beautiful creations we&apos;ve crafted for our lovely customers.
        </motion.p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
        {categories.map((cat, i) => (
          <motion.button
            key={cat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setActiveTab(cat)}
            className={`px-5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
              activeTab === cat
                ? "bg-rose-pink text-white shadow-md shadow-rose-pink/20"
                : "bg-card border border-border/50 text-muted-foreground hover:text-rose-pink hover:border-rose-pink/30"
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      {/* Masonry-like Grid */}
      <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className="break-inside-avoid"
            >
              <div
                className={`relative group overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br ${item.gradient} flex flex-col items-center justify-center cursor-pointer transition-shadow hover:shadow-xl hover:shadow-rose-pink/5`}
                style={{ height: "auto" }}
              >
                <div className={`w-full ${item.height} flex items-center justify-center text-7xl select-none group-hover:scale-110 transition-transform duration-500`}>
                  {item.emoji}
                </div>

                {/* Footer Info of Card */}
                <div className="w-full bg-card border-t border-border/40 p-4 flex items-center justify-between z-10">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-rose-pink block mb-0.5">
                      {item.category}
                    </span>
                    <h3 className="font-heading font-semibold text-foreground text-sm">
                      {item.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-xs font-semibold">
                    <Heart className="w-4 h-4 text-rose-pink fill-rose-pink" />
                    <span>{item.likes}</span>
                  </div>
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="bg-white text-foreground px-5 py-2.5 rounded-2xl font-semibold shadow-lg text-sm flex items-center gap-1.5 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <Search className="w-4 h-4 text-rose-pink" />
                    View Details
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
