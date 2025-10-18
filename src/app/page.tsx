
"use client";
/**
 * @fileOverview This is the home page of the application.
 * It serves as the main entry point for authenticated users.
 * It checks for user authentication and redirects to the login page if the user is not logged in.
 * The main content of this page is the `GateAiPrep` component, which is the quiz configuration form.
 */

import GateAiPrep from "@/components/gate-ai-prep";
import { useAuth } from "@/hooks/use-auth.tsx";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * @component Home
 * @description The main component for the home page.
 * It uses the `useAuth` hook to manage authentication state and redirects
 * unauthenticated users. While loading, it displays a spinner.
 */
export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Effect to handle redirection based on authentication state.
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Display a loading spinner while checking auth state or if the user is not yet available.
  // This page will redirect, so this is just a brief interstitial.
  return (
    <div className="flex items-center justify-center min-h-[calc(100dvh-11.5rem)]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
