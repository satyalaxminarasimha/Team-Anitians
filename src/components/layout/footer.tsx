/**
 * @fileOverview This file defines the global Footer component for the application.
 */

import { BrainCircuit, Mail, Github, Twitter } from "lucide-react";
import Link from "next/link";

/**
 * @component Footer
 * @description A modern footer component that renders the application's footer,
 * including a logo, navigation links, social media links, and copyright notice.
 */
export function Footer() {
  return (
    <footer className="border-t bg-gradient-to-r from-background to-primary/5">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 gap-8">
            {/* Brand Section (centered) */}
            <div className="col-span-1 text-center md:text-center md:col-span-1">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="relative">
                  <BrainCircuit className="h-8 w-8 text-primary" />
                  <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm opacity-50"></div>
                </div>
                <span className="text-xl font-bold font-headline bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Exam AI Prep
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mx-auto">
                AI-powered exam preparation platform that helps students excel in competitive exams 
                with personalized quizzes, detailed explanations, and progress tracking.
              </p>
              <div className="flex space-x-4 mt-6 justify-center">
                <Link 
                  href="mailto:support@examaiprep.com" 
                  className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors group"
                >
                  <Mail className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                </Link>
                <Link 
                  href="https://github.com" 
                  className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors group"
                >
                  <Github className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                </Link>
                <Link 
                  href="https://twitter.com" 
                  className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors group"
                >
                  <Twitter className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-border/50 mt-12 pt-8">
            <div className="flex flex-col items-center text-center">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Exam AI Prep. All rights reserved.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Made with ❤️ for students worldwide
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
