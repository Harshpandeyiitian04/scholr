import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scholr — AI Study Intelligence",
  description:
    "Upload your notes, get summaries, generate quizzes, and ace your exams. Built for Indian engineering students.",
  keywords: ["study", "AI", "quiz", "notes", "engineering", "GATE", "JEE"],
};

/** Root layout that applies global fonts, metadata, and the Sonner toast provider to every page. */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-white`}
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              color: "#fff",
            },
          }}
        />
      </body>
    </html>
  );
}