import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import { ReminderProvider } from "@/components/reminders/reminder-store";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reminder Hub – Organize Life, Work & Goals",
  description:
    "Reminder Hub helps you organize reminders by life areas, stay consistent, and never forget what matters. Simple, focused, and smart.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <ClerkProvider>
          <ReminderProvider>{children}</ReminderProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
