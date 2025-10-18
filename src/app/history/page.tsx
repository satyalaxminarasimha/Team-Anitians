
"use client";
/**
 * @fileOverview This file contains the HistoryPage component, which displays a list
 * of the user's previously completed quizzes.
 *
 * It features:
 * - Authentication check to redirect non-logged-in users.
 * - Loading state while fetching history.
 * - An empty state message if no history exists.
 * - A list of `QuizHistoryCard` components, one for each completed quiz.
 */

import { Accordion } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuizHistory, type QuizHistoryItem } from "@/hooks/use-quiz-history";
import { History as HistoryIcon, Calendar, CheckCircle, Percent, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ResultItem } from "@/components/quiz-result-item";

/**
 * @component HistoryPage
 * @description The main component for displaying the user's quiz history.
 * It uses the `useAuth` hook to ensure the user is logged in and the
 * `useQuizHistory` hook to fetch and display the data.
 */
export default function HistoryPage() {
    const { user, loading: authLoading } = useAuth();
    const { history, loading: historyLoading } = useQuizHistory();
    const router = useRouter();

    // Effect to redirect unauthenticated users.
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    const isLoading = authLoading || historyLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100dvh-11.5rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!user) {
        return null; // Should be redirected by the effect, so render nothing.
    }

    return (
        <div className="container mx-auto max-w-5xl py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight lg:text-5xl font-headline">
                    Your Quiz History
                </h1>
                <p className="mt-4 text-lg sm:text-xl text-muted-foreground">
                    Review your past quizzes and track your progress over time.
                </p>
            </div>

            {history.length === 0 ? (
                // Display an empty state card if there's no history.
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline">Past Quizzes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
                            <HistoryIcon className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold text-muted-foreground">No History Yet</h3>
                            <p className="text-muted-foreground mt-2">Complete a quiz to see your history here.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                // Display the list of history cards.
                <div className="space-y-8">
                    {history.map((quiz) => (
                        <QuizHistoryCard key={quiz.id} quiz={quiz} />
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * @component QuizHistoryCard
 * @description A card component that displays a summary of a single past quiz.
 * It shows the quiz configuration, score, and contains an accordion of the
 * questions and answers for review.
 * @param {{ quiz: QuizHistoryItem }} props
 */
function QuizHistoryCard({ quiz }: { quiz: QuizHistoryItem }) {
    const percentage = Math.round((quiz.score / quiz.questions.length) * 100);

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl">{quiz.config.engineeringStream}</CardTitle>
                <CardDescription>
                    {quiz.config.exam} | {quiz.config.difficultyLevel} | {quiz.questions.length} Questions
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(quiz.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <CheckCircle className="h-4 w-4" />
                        <span>{quiz.score}/{quiz.questions.length} Correct</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        <span>{percentage}%</span>
                    </div>
                </div>
                {/* Accordion to display each question and its result. */}
                <Accordion type="single" collapsible className="w-full">
                    {quiz.questions.map((q, index) => (
                        <ResultItem
                            key={index}
                            question={q}
                            userAnswer={quiz.userAnswers[index]}
                            index={index}
                            quizConfig={quiz.config}
                        />
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    )
}
