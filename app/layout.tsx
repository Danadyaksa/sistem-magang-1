import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
// 1. Import Toaster dari sonner
import { Toaster } from "sonner";

const outfit = Outfit({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Magang Disdikpora DIY",
  description: "Magang di Dinas Pendidikan, Pemuda, dan Olahraga DIYx",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        
        {/* 2. Pasang Component Toaster disini */}
        {/* position="top-center" -> Biar muncul di tengah atas */}
        {/* richColors -> Biar sukses warnanya hijau, error warnanya merah (cakep) */}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}