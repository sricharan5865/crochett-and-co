"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { MessageCircle, ArrowRight, Sparkles } from "lucide-react";
import { generateQuickChat } from "@/lib/whatsapp";
import YarnBallCanvas from "./yarn-ball-canvas";

const floatingFlowers = [
  { emoji: "🌸", x: "10%", y: "20%", delay: 0, duration: 6 },
  { emoji: "🌷", x: "85%", y: "15%", delay: 1, duration: 7 },
  { emoji: "🌻", x: "75%", y: "65%", delay: 2, duration: 5 },
  { emoji: "🌹", x: "15%", y: "70%", delay: 0.5, duration: 8 },
  { emoji: "💐", x: "90%", y: "40%", delay: 1.5, duration: 6 },
  { emoji: "🌺", x: "5%", y: "45%", delay: 3, duration: 7 },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] lg:min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Floating Flowers */}
      {floatingFlowers.map((flower, i) => (
        <motion.span
          key={i}
          className="absolute text-3xl sm:text-4xl opacity-30 pointer-events-none select-none"
          style={{ left: flower.x, top: flower.y }}
          animate={{
            y: [-20, 20, -20],
            rotate: [-10, 10, -10],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: flower.duration,
            repeat: Infinity,
            delay: flower.delay,
            ease: "easeInOut",
          }}
        >
          {flower.emoji}
        </motion.span>
      ))}

      {/* Decorative circles */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-rose-pink/5 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-lavender/5 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20 lg:py-0 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column - Copy & CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex justify-center lg:justify-start"
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-pink/10 rounded-full text-rose-pink text-sm font-medium mb-8">
                <Sparkles className="w-4 h-4" />
                Handmade With Love
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
              className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight"
            >
              Handmade Gifts That
              <br />
              <span className="text-gradient">Never Fade</span>{" "}
              <span className="inline-block">🌸</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl lg:max-w-none leading-relaxed"
            >
              Custom Crochet Bouquets, Flowers & Personalized Gifts Made With Love.
              Each piece is unique, just like your special moments.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <a
                href={generateQuickChat()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#25D366] text-white font-semibold rounded-2xl hover:bg-[#20BD5A] transition-all hover:shadow-lg hover:shadow-green-500/20 text-base"
              >
                <MessageCircle className="w-5 h-5" />
                Order on WhatsApp
              </a>

              <Link
                href="/custom-orders"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-rose-pink text-white font-semibold rounded-2xl hover:bg-rose-pink-dark transition-all hover:shadow-lg hover:shadow-rose-pink/20 text-base"
              >
                <Sparkles className="w-5 h-5" />
                Create Custom Design
              </Link>

              <Link
                href="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-foreground/20 text-foreground font-semibold rounded-2xl hover:border-rose-pink hover:text-rose-pink transition-all text-base"
              >
                Browse Collection
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="mt-12 flex items-center justify-center lg:justify-start gap-6 sm:gap-10 text-muted-foreground"
            >
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">500+</p>
                <p className="text-xs">Happy Customers</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">4.9⭐</p>
                <p className="text-xs">Average Rating</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">100%</p>
                <p className="text-xs">Handmade</p>
              </div>
            </motion.div>
          </div>

          {/* Right Column - 3D Visualizer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.25, type: "spring" }}
            className="lg:col-span-5 flex justify-center items-center"
          >
            <YarnBallCanvas />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
