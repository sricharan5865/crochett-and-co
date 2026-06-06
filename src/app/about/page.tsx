import Link from "next/link";

export const metadata = {
  title: "About Our Story — Crochett & Co",
  description: "Learn about Crochett & Co, our passion for creating beautiful handmade crochet flowers, custom bouquets, and gifts that last forever.",
};

const values = [
  {
    icon: "🧶",
    title: "100% Handmade",
    description: "Every single stitch is carefully crafted by hand, making each flower and gift completely unique.",
  },
  {
    icon: "🌸",
    title: "Never Fading",
    description: "Unlike real flowers, our crochet bouquets stay vibrant and fresh forever, preserving your special moments.",
  },
  {
    icon: "💝",
    title: "Made with Love",
    description: "We pour our heart and soul into every stitch, creating gifts that carry emotional warmth and care.",
  },
  {
    icon: "✨",
    title: "Fully Customizable",
    description: "Choose your favorite flowers, wrap styling, or design a completely new item from scratch to match your vision.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Story Hero */}
      <section className="bg-gradient-to-br from-rose-pink/10 via-lavender/5 to-cream/20 py-16 md:py-24 text-center px-4">
        <div className="max-w-4xl mx-auto">
          <span className="text-6xl mb-4 block">🌸</span>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
            Our Story
          </h1>
          <p className="mt-4 text-muted-foreground text-lg md:text-xl max-w-xl mx-auto leading-relaxed font-light">
            Crafting memories, one stitch at a time. Discover how we turn simple yarn into everlasting blooms.
          </p>
        </div>
      </section>

      {/* Main Story Content */}
      <section className="max-w-4xl mx-auto px-4 py-16 md:py-24 space-y-12">
        <div className="space-y-6 text-base md:text-lg leading-relaxed text-muted-foreground">
          <p>
            Welcome to <strong className="text-foreground">Crochett & Co</strong>! What started as a small personal hobby and a passion for knitting has grown into a beloved digital boutique dedicated to crafting beautiful, long-lasting crochet gifts, flower bouquets, and accessories.
          </p>
          <p>
            We believe that the best gifts are the ones that carry a personal connection, a sense of effort, and emotional warmth. That is why we specialize in creating crochet flowers—everlasting symbols of affection, gratitude, and celebration that will never wilt or fade away.
          </p>
          <p>
            Whether it&apos;s a sunflower bouquet to brighten a birthday, lavender stems for a calming room vibe, or custom keychains and accessories, each piece is individually crafted using high-quality yarns and an eye for intricate detail.
          </p>
        </div>

        {/* Why Choose Us */}
        <div className="pt-8">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
            Why Choose Crochett & Co?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-4xl mb-4 block">{v.icon}</span>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                  {v.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story CTA */}
      <section className="bg-gradient-to-tr from-[#2D2228] to-[#1A1218] text-white py-16 text-center px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl font-bold mb-4">
            Ready to find the perfect gift?
          </h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto text-sm sm:text-base">
            Browse our curated collections or design a custom bouquet that speaks your heart.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/shop"
              className="w-full sm:w-auto px-8 py-3.5 bg-rose-pink hover:bg-rose-pink-dark text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-rose-pink/20 text-center"
            >
              Browse Shop
            </Link>
            <Link
              href="/build-your-bouquet"
              className="w-full sm:w-auto px-8 py-3.5 border-2 border-white/20 hover:border-white text-white font-semibold rounded-2xl transition-colors text-center"
            >
              Build a Bouquet
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
