"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Sparkles, MessageCircle } from "lucide-react";
import { generateQuickChat } from "@/lib/whatsapp";

export default function CustomDesignCTA() {
  return (
    <section className="relative py-24 px-4 sm:px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-lavender/30 via-rose-pink/20 to-sunflower/10" />
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F28AAE' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-5xl mb-6 block">✨</span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            Design Your Dream Gift
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Have a unique idea? Our artisans will bring your imagination to life
            with handmade crochet magic. Share your vision, and we&apos;ll create
            something truly special.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/custom-orders"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-rose-pink text-white font-semibold rounded-2xl hover:bg-rose-pink-dark transition-all hover:shadow-lg text-base"
            >
              <Sparkles className="w-5 h-5" />
              Start Custom Order
            </Link>
            <a
              href={generateQuickChat()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#25D366] text-white font-semibold rounded-2xl hover:bg-[#20BD5A] transition-all hover:shadow-lg text-base"
            >
              <MessageCircle className="w-5 h-5" />
              Order on WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
