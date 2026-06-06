"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Send, MessageCircle, Mail, Clock } from "lucide-react";
import { generateWhatsAppLink } from "@/lib/whatsapp";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const contactCards = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "Chat with us",
    detail: "Usually replies within an hour",
    color: "bg-green-50 text-green-600 border-green-200",
    iconColor: "text-green-600",
    href: `https://wa.me/919XXXXXXXXX?text=${encodeURIComponent("Hello Crochett & Co! 🌸 I'd like to know more about your products.")}`,
  },
  {
    icon: InstagramIcon,
    label: "Instagram",
    value: "@crochett.and.co",
    detail: "Follow us for daily inspiration",
    color: "bg-pink-50 text-pink-600 border-pink-200",
    iconColor: "text-pink-600",
    href: "https://instagram.com/crochett.and.co",
  },
  {
    icon: Mail,
    label: "Email",
    value: "hello@crochettandco.com",
    detail: "We reply within 24 hours",
    color: "bg-lavender-light/50 text-lavender-dark border-lavender/40",
    iconColor: "text-lavender-dark",
    href: "mailto:hello@crochettandco.com",
  },
  {
    icon: Clock,
    label: "Working Hours",
    value: "Mon – Sat, 10 AM – 7 PM",
    detail: "Sunday: Closed (crafting day! 🧶)",
    color: "bg-sunflower/10 text-sunflower-dark border-sunflower/30",
    iconColor: "text-sunflower-dark",
    href: undefined,
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const message = `Hello Crochett & Co! 🌸

*Contact Form Submission*

*Name:* ${formData.name}
*Email:* ${formData.email}
*Subject:* ${formData.subject}

*Message:*
${formData.message}`;

    window.open(generateWhatsAppLink(message), "_blank");
    setSubmitted(true);
  }

  return (
    <section className="py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground">
            Get In Touch 💌
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-lg">
            Have a question, custom order request, or just want to say hello? We&apos;d love to hear from you!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {submitted ? (
              <div className="bg-card rounded-2xl border border-border/50 p-8 text-center shadow-sm">
                <div className="text-6xl mb-4">✨</div>
                <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
                  Message Sent!
                </h2>
                <p className="text-muted-foreground mb-6">
                  We&apos;ve redirected you to WhatsApp. We&apos;ll get back to you as soon as possible!
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: "", email: "", subject: "", message: "" });
                  }}
                  className="px-6 py-2.5 bg-rose-pink text-white rounded-full font-medium hover:bg-rose-pink-dark transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-card rounded-2xl border border-border/50 p-6 md:p-8 shadow-sm space-y-5"
              >
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-pink/30 focus:border-rose-pink transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-pink/30 focus:border-rose-pink transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-rose-pink/30 focus:border-rose-pink transition-all"
                  >
                    <option value="">Select a subject</option>
                    <option value="Custom Order">Custom Order</option>
                    <option value="Product Inquiry">Product Inquiry</option>
                    <option value="Bulk Order">Bulk Order</option>
                    <option value="Collaboration">Collaboration</option>
                    <option value="Feedback">Feedback</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-pink/30 focus:border-rose-pink transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-rose-pink text-white font-medium rounded-full hover:bg-rose-pink-dark transition-colors shadow-lg shadow-rose-pink/25"
                >
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            )}
          </motion.div>

          {/* Contact Info Cards */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            {contactCards.map((card, index) => {
              const CardWrapper = card.href ? "a" : "div";
              const linkProps = card.href
                ? { href: card.href, target: "_blank" as const, rel: "noopener noreferrer" }
                : {};

              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                >
                  <CardWrapper
                    {...linkProps}
                    className={`block bg-card rounded-2xl border border-border/50 p-5 shadow-sm hover:shadow-md transition-all ${card.href ? "cursor-pointer" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`shrink-0 p-3 rounded-xl border ${card.color}`}
                      >
                        <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                          {card.label}
                        </p>
                        <p className="font-heading font-semibold text-foreground mt-0.5">
                          {card.value}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {card.detail}
                        </p>
                      </div>
                    </div>
                  </CardWrapper>
                </motion.div>
              );
            })}

            {/* Map / Location Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="bg-gradient-to-br from-cream-dark/40 via-rose-pink/10 to-lavender/15 rounded-2xl p-8 text-center border border-border/50"
            >
              <span className="text-5xl">📍</span>
              <p className="font-heading font-semibold text-foreground mt-3">
                Based in India
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                We deliver handmade love across the country 🇮🇳
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
