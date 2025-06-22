// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HeaderManager from "@/components/HeaderManager";
import { DineCartProvider, useDineCart } from "@/context/DineCartContext";
import { OnlineCartProvider, useOnlineCart } from "@/context/OnlinecartContext";
import AuthGuard from "@/components/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CME OI",
  description: "CME OI app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>{/* Metadata and other head elements go here */}</head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-gray-200 to-gray-300`}
      >
        <DineCartProvider>
          <OnlineCartProvider>
          <HeaderManager />
          <main className="pt-20 mx-auto max-w-screen-lg">
            <AuthGuard>{children}</AuthGuard>
          </main>
          </OnlineCartProvider>
        </DineCartProvider>
      </body>
    </html>
  );
}