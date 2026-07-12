import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aakar's Eduvision — AI-Powered Coaching Center Chat Agent",
  description:
    "Get instant answers about courses, batch timings, fee structure, faculty, and past papers for JEE, NEET, and MHT-CET preparation.",
  keywords: [
    "JEE coaching",
    "NEET coaching",
    "MHT-CET",
    "coaching center",
    "AI chat assistant",
    "past papers",
    "batch timings",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
