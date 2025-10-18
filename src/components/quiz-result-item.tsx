
"use client";
/**
 * @fileOverview This file contains components for displaying the results of a single quiz question.
 *
 * It includes:
 * - `ResultItem`: An accordion item showing the question, user's answer, and correctness.
 * - `Explanation`: A button that fetches and displays an AI-generated explanation for the answer.
 */

import { useState } from "react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CheckCircle, HelpCircle, Loader2, XCircle } from "lucide-react";
import { getExplanationAction } from "@/app/actions";
import type { Question, QuizConfig } from "@/components/gate-ai-prep";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * @component ResultItem
 * @description An accordion item that displays the result of a single question.
 * It shows whether the user's answer was correct or incorrect and contains the
 * `Explanation` component in its content.
 * @param {{ question: Question, userAnswer: string | undefined, index: number, quizConfig: QuizConfig | null }} props
 */
export function ResultItem({ question, userAnswer, index, quizConfig }: { question: Question, userAnswer: string | undefined, index: number, quizConfig: QuizConfig | null}) {
    const isCorrect = () => {
      switch (question.type) {
        case 'MCQ':
          return question.correctAnswer === userAnswer;

        case 'MSQ':
          if (Array.isArray(userAnswer) && Array.isArray(question.correctAnswer)) {
            return (
              userAnswer.length === question.correctAnswer.length &&
              userAnswer.every(ans => question.correctAnswer.includes(ans)) &&
              (question.correctAnswer as string[]).every(ans => userAnswer.includes(ans))
            );
          }
          return false;

        case 'NTQ':
          if (typeof userAnswer === 'number' && typeof question.correctAnswer === 'number') {
            const range = question.numericRange || 
              { min: question.correctAnswer - 0.01, max: question.correctAnswer + 0.01 };
            return userAnswer >= range.min && userAnswer <= range.max;
          }
          return false;

        default:
          return false;
      }
    };

    const formatAnswer = (answer: string | string[] | number | undefined) => {
      if (!answer) return "Not answered";
      if (Array.isArray(answer)) return answer.join(', ');
      return answer.toString();
    };

    const isAnswerCorrect = isCorrect();
    return (
        <AccordionItem value={`item-${index}`}>
            <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4 w-full pr-4">
                    {isAnswerCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                        <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    )}
                    <span className="text-left flex-1">
                      {question.type} - Question {index + 1}: {question.question}
                    </span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-2 pb-4">
                <div className="space-y-4">
                    <p>Your answer: <span className={cn("font-semibold", isAnswerCorrect ? "text-green-600" : "text-destructive")}>{formatAnswer(userAnswer)}</span></p>
                    <p>Correct answer: <span className="font-semibold text-green-600">{formatAnswer(question.correctAnswer)}</span></p>
                    {question.type === 'NTQ' && question.numericRange && (
                      <p className="text-sm text-muted-foreground">
                        Acceptable range: {question.numericRange.min} to {question.numericRange.max}
                      </p>
                    )}
                    <Explanation question={question} quizConfig={quizConfig} />
                </div>
            </AccordionContent>
        </AccordionItem>
    )
}

/**
 * @component Explanation
 * @description A component that displays a button to fetch an AI-generated explanation.
 * Once fetched, it displays the explanation text.
 * @param {{ question: Question, quizConfig: QuizConfig | null }} props
 */
export function Explanation({ question, quizConfig }: { question: Question, quizConfig: QuizConfig | null }) {
    const [explanation, setExplanation] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    /**
     * Fetches the explanation from the server action.
     */
    const fetchExplanation = async () => {
        if (!quizConfig) return;
        setIsLoading(true);
        const result = await getExplanationAction({
            question: question.question,
            correctAnswer: question.correctAnswer,
            incorrectAnswers: question.options.filter(o => o !== question.correctAnswer),
            engineeringStream: quizConfig.engineeringStream,
        });
        setIsLoading(false);
        if (result.success && result.data) {
            setExplanation(result.data.explanation);
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.error || "Failed to load explanation.",
            });
        }
    };
    
    // If explanation is loaded, display it.
    if (explanation) {
        return (
            <div className="prose prose-sm max-w-none p-4 border rounded-md bg-secondary/50">
                <h4 className="font-headline">Explanation:</h4>
                <div dangerouslySetInnerHTML={{ __html: explanation.replace(/\\n/g, '<br />') }} />
            </div>
        );
    }
    
    // Otherwise, display the button to fetch it.
    return (
        <Button variant="outline" size="sm" onClick={fetchExplanation} disabled={isLoading || !quizConfig}>
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting Explanation...
                </>
            ) : (
                 <>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Show AI Explanation
                </>
            )}
        </Button>
    )
}
