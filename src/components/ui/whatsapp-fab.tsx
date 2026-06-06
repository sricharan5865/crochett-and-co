"use client";

import { motion } from "motion/react";
import { MessageCircle } from "lucide-react";
import { generateQuickChat } from "@/lib/whatsapp";

export default function WhatsAppFab() {
  return (
    <motion.a
      href={generateQuickChat()}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-shadow"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200 }}
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-6 h-6 text-white" />

      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full animate-ping bg-[#25D366]/30" />
      <span className="absolute -inset-1 rounded-full bg-[#25D366]/10 animate-pulse" />
    </motion.a>
  );
}
