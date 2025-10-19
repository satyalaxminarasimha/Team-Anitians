
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
import type { Question, QuizConfig } from "@/types/quiz.types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * @component ResultItem
 * @description An accordion item that displays the result of a single question.
 * It shows whether the user's answer was correct or incorrect and contains the
 * `Explanation` component in its content.
 * @param {{ question: Question, userAnswer: string | string[] | number | undefined, index: number, quizConfig: QuizConfig | null }} props
 */
export function ResultItem({ question, userAnswer, index, quizConfig }: { 
    question: Question, 
    userAnswer: string | string[] | number | undefined, 
    index: number, 
    quizConfig: QuizConfig | null
}) {
    const isCorrect = () => {
      if (userAnswer === undefined || userAnswer === null) {
        console.log(`Question ${index + 1}: Not answered`);
        return false;
      }

      // Log the values being compared
      console.log(`Question ${index + 1}:`, {
        type: question.type,
        userAnswer,
        correctAnswer: question.correctAnswer,
        userAnswerType: typeof userAnswer,
        correctAnswerType: typeof question.correctAnswer,
        isUserAnswerArray: Array.isArray(userAnswer),
        isCorrectAnswerArray: Array.isArray(question.correctAnswer)
      });

      switch (question.type) {
        case 'MCQ':
          if (typeof userAnswer === 'string' && typeof question.correctAnswer === 'string') {
            const userStr = userAnswer.trim();
            const correctStr = question.correctAnswer.trim();
            const mcqResult = userStr === correctStr;
            console.log('MCQ comparison:', { userStr, correctStr, mcqResult });
            return mcqResult;
          }
          return false;

        case 'MSQ':
          // Handle both string and array inputs for MSQ
          let userArray: string[];
          let correctArray: string[];

          // Convert user answer to array
          if (Array.isArray(userAnswer)) {
            userArray = userAnswer.map(a => String(a).trim());
          } else if (typeof userAnswer === 'string') {
            if (userAnswer.includes(',')) {
              userArray = userAnswer.split(',').map(s => s.trim());
            } else {
              userArray = [userAnswer.trim()];
            }
          } else {
            return false;
          }

          // Convert correct answer to array
          if (Array.isArray(question.correctAnswer)) {
            correctArray = question.correctAnswer.map(a => String(a).trim());
          } else if (typeof question.correctAnswer === 'string') {
            if (question.correctAnswer.includes(',')) {
              correctArray = question.correctAnswer.split(',').map(s => s.trim());
            } else {
              correctArray = [question.correctAnswer.trim()];
            }
          } else {
            return false;
          }

          const lengthMatch = userArray.length === correctArray.length;
          const userHasAll = userArray.every(ans => correctArray.includes(ans));
          const correctHasAll = correctArray.every(ans => userArray.includes(ans));
          const msqResult = lengthMatch && userHasAll && correctHasAll;

          console.log('MSQ comparison:', {
            userArray,
            correctArray,
            lengthMatch,
            userHasAll,
            correctHasAll,
            msqResult
          });
          return msqResult;

        case 'NTQ':
          const userNum = Number(userAnswer);
          const correctNum = Number(question.correctAnswer);
          
          if (!isNaN(userNum) && !isNaN(correctNum)) {
            const range = question.numericRange || 
              { min: correctNum - 0.01, max: correctNum + 0.01 };
            const ntqResult = userNum >= range.min && userNum <= range.max;
            console.log('NTQ comparison:', { userNum, correctNum, range, ntqResult });
            return ntqResult;
          }
          console.log('NTQ invalid numbers:', { userAnswer, correctAnswer: question.correctAnswer });
          return false;

        default:
          console.log('Unknown question type:', question.type);
          return false;
      }
    };

    const formatAnswer = (answer: string | string[] | number | undefined) => {
      if (answer === undefined || answer === null) return "Not answered";
      
      if (Array.isArray(answer)) {
        return answer.map(a => String(a).trim()).join(', ');
      }
      
      if (typeof answer === 'string') {
        return answer.trim();
      }
      
      if (typeof answer === 'number') {
        return answer.toString();
      }
      
      return "Invalid answer format";
    };

    const isAnswerCorrect = isCorrect();
    return (
        <AccordionItem value={`item-${index}`}>
            <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4 w-full pr-4">
                    <span className="flex-shrink-0 font-semibold w-8 text-center">
                      #{index + 1}
                    </span>
                    <span className="text-left flex-1">
                      {question.type} - {question.question}
                    </span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-2 pb-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <p>Your answer: <span className={cn("font-semibold", isAnswerCorrect ? "text-green-600" : "text-destructive")}>{formatAnswer(userAnswer)}</span></p>
                        <p>Correct answer: <span className="font-semibold text-green-600">{formatAnswer(question.correctAnswer)}</span></p>
                        <p className="text-sm text-muted-foreground">
                            Status: {question.errorType || (isAnswerCorrect ? 'Correct' : 'Incorrect')}
                        </p>
                    </div>
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
        
        // Format the correct answer as a string
        const formattedAnswer = Array.isArray(question.correctAnswer) 
            ? question.correctAnswer.join(', ')
            : String(question.correctAnswer);

        // Filter incorrect answers based on question type
        const incorrectAnswers = question.options?.filter(o => {
            if (Array.isArray(question.correctAnswer)) {
                return !question.correctAnswer.includes(o);
            }
            return o !== String(question.correctAnswer);
        }) || [];

        const result = await getExplanationAction({
            question: question.question,
            correctAnswer: formattedAnswer,
            incorrectAnswers,
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
