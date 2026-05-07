import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lemonpay - Invoice Generator",
  description: "Invoice generator for Lemonpay merchants",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
