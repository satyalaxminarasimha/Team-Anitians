
/**
 * @fileOverview This is the root layout file for the Next.js application.
 * It wraps all pages with a common structure, including the header, footer,
 * and global providers like the `AuthProvider` and `Toaster`.
 * It also defines the global fonts and metadata for the application.
 */

import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";

// Define the fonts used in the application.
const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter" 
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-code",
});

// Define the global metadata for the application.
export const metadata: Metadata = {
  title: "Exam AI Prep",
  description:
    "AI-powered exam preparation with tailored MCQs and explanations.",
};

/**
 * @component RootLayout
 * @description The root layout component that wraps every page.
 * @param {{ children: React.ReactNode }} props
 * @returns {React.ReactElement} The main HTML structure of the application.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-body antialiased",
          inter.variable,
          sourceCodePro.variable
        )}
      >
        <AuthProvider>
          <div className="relative flex min-h-dvh flex-col bg-background">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
