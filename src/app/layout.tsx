import type { Metadata } from "next";
import { playfair, inter } from "@/lib/fonts";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import WhatsAppFab from "@/components/ui/whatsapp-fab";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crochett & Co — Handmade Crochet Gifts & Custom Bouquets",
  description:
    "Handmade crochet bouquets, flowers & personalized gifts that never fade. Custom designs, gift hampers & more. Made with love, delivered across India. Order on WhatsApp!",
  keywords: [
    "crochet bouquets",
    "handmade gifts",
    "custom crochet",
    "crochet flowers",
    "gift hampers",
    "personalized gifts",
    "crochett and co",
  ],
  openGraph: {
    title: "Crochett & Co — Handmade Crochet Gifts & Custom Bouquets",
    description:
      "Custom crochet bouquets, flowers & personalized gifts made with love. Order yours today!",
    siteName: "Crochett & Co",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <TooltipProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppFab />
        </TooltipProvider>
      </body>
    </html>
  );
}
