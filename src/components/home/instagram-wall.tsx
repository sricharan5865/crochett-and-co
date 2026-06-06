"use client";

import { motion } from "motion/react";
import { Heart, ExternalLink } from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const instagramPosts = [
  { emoji: "💐", gradient: "from-rose-pink/30 to-lavender/30", likes: 234 },
  { emoji: "🌹", gradient: "from-rose-pink-dark/30 to-rose-pink/30", likes: 189 },
  { emoji: "🌻", gradient: "from-sunflower/30 to-sunflower-light/30", likes: 312 },
  { emoji: "🌷", gradient: "from-rose-pink/20 to-cream-dark/30", likes: 267 },
  { emoji: "🎁", gradient: "from-lavender/30 to-rose-pink/20", likes: 145 },
  { emoji: "🌸", gradient: "from-rose-pink-light/30 to-sage/20", likes: 198 },
];

export default function InstagramWall() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 mb-4">
          <InstagramIcon className="w-6 h-6 text-rose-pink" />
          <span className="text-sm font-medium text-rose-pink">Instagram</span>
        </div>
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
          Follow Our Journey
        </h2>
        <p className="mt-2 text-muted-foreground">
          @crochett.and.co
        </p>
      </motion.div>

      {/* Instagram Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {instagramPosts.map((post, i) => (
          <motion.a
            key={i}
            href="https://www.instagram.com/crochett.and.co"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className={`group relative aspect-square rounded-2xl bg-gradient-to-br ${post.gradient} flex items-center justify-center overflow-hidden cursor-pointer`}
          >
            <span className="text-5xl sm:text-6xl group-hover:scale-110 transition-transform duration-300">
              {post.emoji}
            </span>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5 text-white">
                <Heart className="w-5 h-5 fill-white" />
                <span className="font-semibold">{post.likes}</span>
              </div>
            </div>
          </motion.a>
        ))}
      </div>

      {/* Follow Button */}
      <div className="text-center mt-10">
        <a
          href="https://www.instagram.com/crochett.and.co"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity shadow-lg"
        >
          <InstagramIcon className="w-5 h-5" />
          Follow Us on Instagram
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}
