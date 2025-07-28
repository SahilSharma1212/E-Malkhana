import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "E Malkhana",
  description:
    "Digitally manage police case properties with the eMalkhana Management System. Upload FIR data, search evidence records, update status, and streamline property custody tracking with a modern responsive interface.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#e6f0ff] min-h-screen overflow-x-hidden`}
      >
        {/* ✅ Navbar */}
        <Navbar/>

        {/* Page Content */}
        <main>{children}</main>
      </body>
    </html>
  );
}
