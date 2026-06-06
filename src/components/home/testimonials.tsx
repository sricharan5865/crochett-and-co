"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    text: "Ordered a custom bouquet for my mom's birthday and she absolutely loved it! The flowers look so real and the colors are beautiful. Will definitely order again!",
    rating: 5,
    location: "Mumbai",
    occasion: "Birthday Gift",
  },
  {
    name: "Rahul Patel",
    text: "Got a Valentine's bouquet for my girlfriend. She was amazed that the flowers were handmade! The quality is incredible and the delivery was on time.",
    rating: 5,
    location: "Delhi",
    occasion: "Valentine's Day",
  },
  {
    name: "Ananya Reddy",
    text: "The gift hamper I ordered was beautifully put together. The crochet roses, chocolate, and card made it such a thoughtful present. Highly recommend!",
    rating: 5,
    location: "Bangalore",
    occasion: "Anniversary",
  },
  {
    name: "Sneha Gupta",
    text: "I ordered matching friendship keychains and they are the cutest things ever! My best friend loved hers. Great quality at such an affordable price.",
    rating: 4,
    location: "Pune",
    occasion: "Friendship Day",
  },
  {
    name: "Arjun Nair",
    text: "Custom ordered a graduation bouquet in our college colors. It was perfect! Everyone was asking where I got it. Crochett & Co is amazing!",
    rating: 5,
    location: "Chennai",
    occasion: "Graduation",
  },
  {
    name: "Meera Iyer",
    text: "The Build Your Bouquet feature is so fun! I picked all my favorite flowers and the final product was even better than expected. Eternal flowers! 💐",
    rating: 5,
    location: "Hyderabad",
    occasion: "Surprise Gift",
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % testimonials.length);
  }, []);

  const prev = () => {
    setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next]);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
          What Our Customers Say 💕
        </h2>
        <p className="mt-4 text-muted-foreground">
          Real reviews from real happy customers.
        </p>
      </motion.div>

      <div
        className="relative max-w-3xl mx-auto"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Testimonial Card */}
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.4 }}
          className="bg-card rounded-2xl p-8 sm:p-10 shadow-lg border border-border/50 text-center"
        >
          <Quote className="w-10 h-10 text-rose-pink/20 mx-auto mb-4" />

          <p className="text-lg text-foreground leading-relaxed italic">
            &ldquo;{testimonials[current].text}&rdquo;
          </p>

          {/* Rating */}
          <div className="flex items-center justify-center gap-1 mt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < testimonials[current].rating
                    ? "fill-sunflower text-sunflower"
                    : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>

          <div className="mt-4">
            <p className="font-semibold text-foreground">
              {testimonials[current].name}
            </p>
            <p className="text-sm text-muted-foreground">
              {testimonials[current].location} •{" "}
              {testimonials[current].occasion}
            </p>
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full bg-card shadow border border-border/50 flex items-center justify-center hover:bg-rose-pink hover:text-white transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === current
                    ? "bg-rose-pink w-6"
                    : "bg-rose-pink/20 hover:bg-rose-pink/40"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-10 h-10 rounded-full bg-card shadow border border-border/50 flex items-center justify-center hover:bg-rose-pink hover:text-white transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
