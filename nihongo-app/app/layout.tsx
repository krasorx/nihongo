import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "./contexts/AuthContext";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aprende Japones con notas interactivas",
  description: "Create Japanese learning materials with kanji, furigana, and translations. Track progress with spaced repetition and organized courses.",
  keywords: "Japanese, learning, kanji, furigana, notes, spaced repetition, courses",
  authors: [{ name: "Luis Espindola" }],
  openGraph: {
    title: "Aprende Japones con notas interactivas",
    description: "Create Japanese learning materials with kanji, furigana, and translations.",
    url: "https://nihongo.luisesp.cloud",
    siteName: "Nihongo Learning",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}