import { Playfair_Display, Inter } from "next/font/google";

export const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
