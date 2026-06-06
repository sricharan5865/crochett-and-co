"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  MessageCircle,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useCartStore } from "@/lib/store/cart-store";
import { useWishlistStore } from "@/lib/store/wishlist-store";
import { generateQuickChat } from "@/lib/whatsapp";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/shop" },
  { name: "Categories", href: "/categories" },
  { name: "Build Your Bouquet", href: "/build-your-bouquet" },
  { name: "Custom Orders", href: "/custom-orders" },
  { name: "Gift Hampers", href: "/gift-hampers" },
  { name: "Gallery", href: "/gallery" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const cartCount = useCartStore((s) => s.getItemCount());
  const wishlistCount = useWishlistStore((s) => s.items.length);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-rose-pink to-lavender text-white text-center text-xs sm:text-sm py-2 px-4 font-medium">
        ✨ Free delivery on orders above ₹999 | Custom orders welcome! ✨
      </div>

      {/* Main Header */}
      <motion.header
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass shadow-lg shadow-rose-pink/5"
            : "bg-white/90 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🌸</span>
              <span className="font-heading text-xl lg:text-2xl font-bold text-foreground group-hover:text-rose-pink transition-colors">
                Crochett & Co
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-rose-pink transition-colors rounded-lg hover:bg-rose-pink/5"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search */}
              <button
                className="p-2 rounded-full hover:bg-rose-pink/10 transition-colors text-foreground/70 hover:text-rose-pink"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="p-2 rounded-full hover:bg-rose-pink/10 transition-colors text-foreground/70 hover:text-rose-pink relative"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-pink text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="p-2 rounded-full hover:bg-rose-pink/10 transition-colors text-foreground/70 hover:text-rose-pink relative"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-pink text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>

              {/* WhatsApp */}
              <a
                href={generateQuickChat()}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex p-2 rounded-full hover:bg-green-50 transition-colors text-green-600"
                aria-label="Chat on WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>

              {/* Mobile Menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger
                  className="lg:hidden p-2 rounded-full hover:bg-rose-pink/10 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-cream p-0" showCloseButton={false}>
                  <div className="flex flex-col h-full">
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between p-6 border-b border-rose-pink/10">
                      <span className="font-heading text-xl font-bold">
                        🌸 Crochett & Co
                      </span>
                      <SheetClose
                        className="p-2 rounded-full hover:bg-rose-pink/10"
                      >
                        <X className="w-5 h-5" />
                      </SheetClose>
                    </div>

                    {/* Mobile Nav Links */}
                    <nav className="flex-1 overflow-y-auto py-4">
                      {navLinks.map((link, i) => (
                        <motion.div
                          key={link.name}
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Link
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="block px-6 py-3.5 text-base font-medium text-foreground/80 hover:text-rose-pink hover:bg-rose-pink/5 transition-colors"
                          >
                            {link.name}
                          </Link>
                        </motion.div>
                      ))}
                    </nav>

                    {/* Mobile Footer */}
                    <div className="p-6 border-t border-rose-pink/10 space-y-3">
                      <a
                        href={generateQuickChat()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white rounded-xl font-semibold hover:bg-[#20BD5A] transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Chat on WhatsApp
                      </a>
                      <a
                        href="https://www.instagram.com/crochett.and.co"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                      >
                        Follow on Instagram
                      </a>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </motion.header>
    </>
  );
}
