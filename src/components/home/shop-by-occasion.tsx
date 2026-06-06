"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { occasions } from "@/lib/data/categories";

export default function ShopByOccasion() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
          Shop By Occasion 🎁
        </h2>
        <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
          Find the perfect handmade gift for every special moment.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {occasions.map((occasion, i) => (
          <motion.div
            key={occasion.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <Link
              href={`/shop?occasion=${occasion.slug}`}
              className={`group block relative p-6 rounded-2xl bg-gradient-to-br ${occasion.gradient} overflow-hidden border border-white/50 hover:shadow-xl hover:shadow-rose-pink/10 transition-all duration-300`}
            >
              <div className="relative z-10">
                <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform duration-300">
                  {occasion.icon}
                </span>
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {occasion.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {occasion.description}
                </p>
              </div>
              {/* Decorative blur */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/20 blur-xl group-hover:scale-150 transition-transform duration-500" />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
