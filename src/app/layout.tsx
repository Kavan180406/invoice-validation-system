import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import RouteGuard from "./route-guard";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InvoiceGuard",
  description: "Invoice Validation and Duplicate Detection System",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense
          fallback={
            <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
              Loading InvoiceGuard...
            </main>
          }
        >
          <RouteGuard>{children}</RouteGuard>
        </Suspense>
      </body>
    </html>
  );
}