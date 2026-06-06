import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Crochett & Co",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No site header/footer — admin has its own chrome
  return <>{children}</>;
}
