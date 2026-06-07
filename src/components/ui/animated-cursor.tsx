"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "motion/react";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
  speed: number;
  scale: number;
}

const SPARKLE_COLORS = ["#F28AAE", "#CDB4DB", "#F6C445", "#8FAE8A", "#90CDF4"];

export default function AnimatedCursor() {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const sparkleIdCounter = useRef(0);

  // Motion values for high performance
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Smooth springs
  const springConfig = { damping: 40, stiffness: 400, mass: 0.4 };
  const trailConfig = { damping: 25, stiffness: 200, mass: 0.8 };

  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const trailXSpring = useSpring(cursorX, trailConfig);
  const trailYSpring = useSpring(cursorY, trailConfig);

  useEffect(() => {
    setMounted(true);
    setIsVisible(true);

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseDown = (e: MouseEvent) => {
      setIsClicked(true);
      
      // Spawn explosion sparkles
      const newSparkles = Array.from({ length: 8 }).map(() => ({
        id: sparkleIdCounter.current++,
        x: e.clientX,
        y: e.clientY,
        color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
        angle: Math.random() * Math.PI * 2,
        speed: 2 + Math.random() * 4,
        scale: 0.5 + Math.random() * 0.8,
      }));

      setSparkles((prev) => [...prev, ...newSparkles]);
    };

    const handleMouseUp = () => setIsClicked(false);
    
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    // Track hovered elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = 
        target.tagName === "A" || 
        target.tagName === "BUTTON" || 
        target.closest("a") || 
        target.closest("button") || 
        target.closest("[role='button']") || 
        target.tagName === "INPUT" || 
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";
      
      setIsHovered(!!isInteractive);
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [cursorX, cursorY]);

  // Clean up old sparkles
  useEffect(() => {
    if (sparkles.length === 0) return;
    const timer = setTimeout(() => {
      setSparkles((prev) => prev.slice(8));
    }, 800);
    return () => clearTimeout(timer);
  }, [sparkles]);

  if (!mounted) return null;

  return (
    <>
      {/* Global Style overrides */}
      <style jsx global>{`
        @media (pointer: fine) {
          body, a, button, select, input, textarea, [role="button"] {
            cursor: none !important;
          }
        }
      `}</style>

      {/* Main Cursor Dots (Only visible on fine pointer devices) */}
      <div className="pointer-events-none fixed inset-0 z-[9999] hidden md:block">
        <AnimatePresence>
          {isVisible && (
            <>
              {/* Delayed trail element */}
              <motion.div
                className="absolute size-8 rounded-full border-2 border-rose-pink/50 bg-rose-pink/5"
                style={{
                  x: trailXSpring,
                  y: trailYSpring,
                  translateX: "-50%",
                  translateY: "-50%",
                }}
                animate={{
                  scale: isHovered ? 1.5 : isClicked ? 0.8 : 1,
                  borderColor: isHovered ? "#F28AAE" : "rgba(242, 138, 174, 0.5)",
                  backgroundColor: isHovered ? "rgba(242, 138, 174, 0.1)" : "rgba(242, 138, 174, 0.05)",
                }}
                transition={{ duration: 0.15 }}
              />

              {/* Inner point */}
              <motion.div
                className="absolute size-2 rounded-full bg-rose-pink shadow-md"
                style={{
                  x: cursorXSpring,
                  y: cursorYSpring,
                  translateX: "-50%",
                  translateY: "-50%",
                }}
                animate={{
                  scale: isHovered ? 0.5 : isClicked ? 1.8 : 1,
                  backgroundColor: isHovered ? "#F28AAE" : "#F28AAE",
                }}
                transition={{ duration: 0.1 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Click Sparkles */}
        {sparkles.map((s) => (
          <motion.div
            key={s.id}
            className="absolute size-2.5 rounded-full"
            style={{
              x: s.x,
              y: s.y,
              backgroundColor: s.color,
              translateX: "-50%",
              translateY: "-50%",
            }}
            initial={{ scale: s.scale, opacity: 1 }}
            animate={{
              x: s.x + Math.cos(s.angle) * s.speed * 12,
              y: s.y + Math.sin(s.angle) * s.speed * 12,
              scale: 0,
              opacity: 0,
            }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        ))}
      </div>
    </>
  );
}
