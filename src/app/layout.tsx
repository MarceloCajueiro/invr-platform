import type { Metadata } from "next";
import { Bricolage_Grotesque, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Fluent",
  description: "AI-powered English learning platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`h-full antialiased ${bricolage.variable} ${outfit.variable} ${jetbrains.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
