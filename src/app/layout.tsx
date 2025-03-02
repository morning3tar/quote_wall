import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ISU Nowruz Quotes Wall",
  description: "Share your quotes and see them appear on the wall in real-time!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-900 text-white min-h-screen`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
