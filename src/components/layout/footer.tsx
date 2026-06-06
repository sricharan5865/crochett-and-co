import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

const quickLinks = [
  { name: "Shop", href: "/shop" },
  { name: "Custom Orders", href: "/custom-orders" },
  { name: "Build Your Bouquet", href: "/build-your-bouquet" },
  { name: "Gift Hampers", href: "/gift-hampers" },
  { name: "Gallery", href: "/gallery" },
  { name: "About Us", href: "/about" },
  { name: "FAQ", href: "/faq" },
];

const categoryLinks = [
  { name: "Bouquets", href: "/categories/crochet-bouquets" },
  { name: "Roses", href: "/categories/roses" },
  { name: "Tulips", href: "/categories/tulips" },
  { name: "Sunflowers", href: "/categories/sunflowers" },
  { name: "Lavender", href: "/categories/lavender-collections" },
  { name: "Hair Clips", href: "/categories/hair-clips" },
  { name: "Bags", href: "/categories/crochet-bags" },
  { name: "Keychains", href: "/categories/keychains" },
];

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#2D2228] to-[#1A1218] text-white/80">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <span className="text-2xl">🌸</span>
              <span className="font-heading text-2xl font-bold text-white">
                Crochett & Co
              </span>
            </Link>
            <p className="text-sm text-white/50 font-medium mb-3">
              Handmade With Love 🌸
            </p>
            <p className="text-sm leading-relaxed text-white/60">
              Crafting beautiful crochet flowers, bouquets, and personalized
              gifts that last forever. Each piece is made with love,
              one stitch at a time.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 mt-6">
              <a
                href="https://www.instagram.com/crochett.and.co"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-rose-pink/30 transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/919XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-green-500/30 transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-500/30 transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                aria-label="Pinterest"
              >
                <Heart className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading text-lg font-semibold text-white mb-5">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-rose-pink transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-heading text-lg font-semibold text-white mb-5">
              Categories
            </h3>
            <ul className="space-y-3">
              {categoryLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-rose-pink transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading text-lg font-semibold text-white mb-5">
              Get In Touch
            </h3>
            <ul className="space-y-4">
              <li>
                <a
                  href="https://wa.me/919XXXXXXXXX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white/60 hover:text-green-400 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  WhatsApp Us
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/crochett.and.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white/60 hover:text-pink-400 transition-colors"
                >
                  <InstagramIcon className="w-4 h-4 shrink-0" />
                  @crochett.and.co
                </a>
              </li>
              <li>
                <p className="text-sm text-white/60">
                  📧 hello@crochettandco.com
                </p>
              </li>
              <li>
                <p className="text-sm text-white/60">
                  🕐 Mon–Sat, 10 AM – 7 PM IST
                </p>
              </li>
            </ul>

            {/* Policies */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <ul className="space-y-2">
                <li>
                  <Link href="/shipping-policy" className="text-xs text-white/40 hover:text-white/60 transition-colors">
                    Shipping Policy
                  </Link>
                </li>
                <li>
                  <Link href="/returns-policy" className="text-xs text-white/40 hover:text-white/60 transition-colors">
                    Returns Policy
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-xs text-white/40 hover:text-white/60 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-xs text-white/40 hover:text-white/60 transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">
              © 2024 Crochett & Co. Handmade With Love. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <p className="text-xs text-white/40">
                💳 We accept UPI, Cards & Net Banking
              </p>
              <Link
                href="/admin"
                className="text-xs text-white/20 hover:text-white/40 transition-colors"
                aria-label="Admin portal"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
