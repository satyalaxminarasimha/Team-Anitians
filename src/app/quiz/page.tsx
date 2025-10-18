
"use client";
/**
 * @fileOverview This is the dedicated page for taking a quiz.
 * It renders the main GateAiPrep component which handles the entire quiz lifecycle.
 */

import GateAiPrep from "@/components/gate-ai-prep";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * @component QuizPage
 * @description The main component for the quiz page.
 * It ensures the user is authenticated before rendering the quiz component.
 */
export default function QuizPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Effect to handle redirection based on authentication state.
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Display a loading spinner while checking auth state or if the user is not yet available.
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-11.5rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Once authenticated, render the main quiz preparation component.
  return <GateAiPrep />;
}
