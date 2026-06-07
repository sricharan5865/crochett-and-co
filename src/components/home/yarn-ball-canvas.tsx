"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Sparkles, Heart, Gift, Compass } from "lucide-react";
import Image from "next/image";

export default function YarnBallCanvas() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  // Motion values for mouse position relative to card
  const rotateXVal = useMotionValue(0);
  const rotateYVal = useMotionValue(0);

  // Springs for smooth movement
  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
  const rotateX = useSpring(rotateXVal, springConfig);
  const rotateY = useSpring(rotateYVal, springConfig);

  // Shadow/Glow shift based on mouse angle
  const shadowX = useTransform(rotateYVal, [-15, 15], [15, -15]);
  const shadowY = useTransform(rotateXVal, [-15, 15], [15, -15]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Mouse position relative to center of the card
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    // Calculate rotation angle (max 15 degrees)
    const rX = -(mouseY / (height / 2)) * 15;
    const rY = (mouseX / (width / 2)) * 15;

    rotateXVal.set(rX);
    rotateYVal.set(rY);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    rotateXVal.set(0);
    rotateYVal.set(0);
  };

  const handleMouseEnter = () => {
    setHovered(true);
  };

  return (
    <div className="relative w-full h-[380px] sm:h-[480px] flex items-center justify-center py-4 px-2">
      {/* Background radial soft light glow */}
      <div className="absolute inset-0 bg-radial-glow opacity-30 blur-2xl pointer-events-none" />

      {/* Main 3D Card Container */}
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: rotateX,
          rotateY: rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full max-w-[340px] aspect-[3/4] rounded-3xl bg-white/40 backdrop-blur-xl border border-white/50 p-4 shadow-2xl cursor-pointer transition-shadow duration-300"
        animate={{
          scale: hovered ? 1.04 : 1,
          boxShadow: hovered 
            ? "0 25px 50px -12px rgba(242, 138, 174, 0.25)" 
            : "0 10px 30px -15px rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* Glow behind the card */}
        <motion.div
          className="absolute -inset-1.5 rounded-[26px] bg-gradient-to-r from-rose-pink to-lavender opacity-0 blur transition-opacity duration-500"
          animate={{ opacity: hovered ? 0.3 : 0 }}
        />

        {/* 3D Depth Inner Layer - Image frame */}
        <div 
          style={{ transform: "translateZ(30px)" }} 
          className="relative w-full h-[80%] rounded-2xl overflow-hidden bg-gradient-to-tr from-rose-pink/10 to-lavender/10 border border-white/30"
        >
          <Image
            src="/premium_crochet_bouquet.png"
            alt="Premium Crochet Bouquet Showcase"
            fill
            className="object-cover select-none transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, 400px"
            priority
            style={{
              transform: hovered ? "scale(1.08)" : "scale(1.02)",
            }}
          />

          {/* Shine effect sweep */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-shine" />

          {/* Floting badgess */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-rose-pink shadow-sm border border-rose-pink/10">
              <Sparkles className="size-3 animate-pulse" />
              100% HANDMADE
            </span>
          </div>

          <div className="absolute bottom-3 right-3">
            <span className="flex items-center gap-1 px-3 py-1 bg-sage/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-white shadow-sm">
              <Heart className="size-3 fill-white" />
              NEVER FADES
            </span>
          </div>
        </div>

        {/* 3D Depth Details Footer */}
        <div 
          style={{ transform: "translateZ(45px)" }}
          className="relative mt-4 flex items-center justify-between px-2"
        >
          <div>
            <span className="text-[11px] font-semibold text-rose-pink tracking-wider uppercase">
              Bespoke Collection
            </span>
            <h3 className="font-heading text-lg font-bold text-foreground leading-snug">
              Custom Bouquet
            </h3>
          </div>
          <div className="flex items-center justify-center size-10 rounded-full bg-gradient-to-r from-rose-pink to-lavender text-white shadow-md shadow-rose-pink/20 hover:scale-110 transition-transform">
            <Gift className="size-4" />
          </div>
        </div>

        {/* Corner micro-decorations */}
        <div className="absolute top-4 right-4 pointer-events-none" style={{ transform: "translateZ(50px)" }}>
          <span className="text-xl">✨</span>
        </div>
      </motion.div>
    </div>
  );
}
