"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Mail, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-cream to-cream-dark/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto text-center"
      >
        <span className="text-4xl mb-4 block">💌</span>
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
          Get 10% Off Your First Order 🌸
        </h2>
        <p className="mt-4 text-muted-foreground">
          Join the Crochett & Co family! Get exclusive offers, new collection
          previews, and handmade inspiration delivered to your inbox.
        </p>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 p-6 bg-sage/10 rounded-2xl"
          >
            <span className="text-3xl block mb-2">🎉</span>
            <p className="font-semibold text-foreground">
              Welcome to the family!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Check your inbox for your 10% discount code.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 py-3 h-12 rounded-xl border-border/50 bg-white focus:ring-rose-pink"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 h-12 bg-rose-pink text-white font-semibold rounded-xl hover:bg-rose-pink-dark transition-colors"
            >
              Subscribe
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          We respect your privacy. Unsubscribe anytime.
        </p>
      </motion.div>
    </section>
  );
}
