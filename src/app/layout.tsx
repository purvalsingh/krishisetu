import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KrishiSetu — farmer-first vegetable marketplace",
  description:
    "Pooled farm-to-neighbourhood vegetable trade: farmers set their own net price, orders travelling to the same cluster share one vehicle, and the buyer sees every rupee of the bill.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
