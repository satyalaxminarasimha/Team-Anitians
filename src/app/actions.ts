
"use server";

/**
 * @fileOverview This file contains all the Server Actions for the application.
 * Server Actions are asynchronous functions that run on the server and can be called
 * directly from client-side components. They are the primary way the client
 * interacts with the server-side logic and database.
 */

import { explainAnswer, ExplainAnswerInput } from "@/ai/flows/explain-answer";
import { generateQuizQuestions, GenerateQuizQuestionsInput, GenerateQuizQuestionsOutput } from "@/ai/flows/generate-quiz-questions";
import { analyzePerformance } from "@/ai/flows/analyze-performance-flow";
import dbConnect from "@/lib/db-connect";
import QuizHistory from "@/models/quiz-history.model";
import ChatHistory from "@/models/chat-history.model";
import UserStats from "@/models/user-stats.model";
import type { QuizHistoryItem } from "@/types/quiz.types";
import { chatWithAI } from "@/ai/flows/chat-flow";
import type { Message } from "@/types/chat.types";
import { isSameDay, subDays } from "date-fns";
import type { Question } from "@/types/quiz.types";
import type { AnalyzePerformanceInput, AnalyzePerformanceOutput } from "@/app/lib/types";


/**
 * Server Action to generate a new quiz.
 * It directly invokes the `generateMCQQuestions` Genkit flow and handles potential errors.
 *
 * @param {GenerateMCQQuestionsInput} input - The configuration for the quiz, including exam, syllabus, etc.
 * @returns {Promise<{success: boolean, data?: GenerateMCQQuestionsOutput, error?: string}>} An object indicating success or failure.
 * On success, it includes the generated quiz data. On failure, it includes an error message.
 */
export async function generateQuizAction(input: GenerateQuizQuestionsInput) {
  try {
    const output: GenerateQuizQuestionsOutput = await generateQuizQuestions(input);
    
    if (!output || !output.questions || output.questions.length === 0) {
        return { success: false, error: 'The AI failed to generate any questions. Please try modifying your syllabus topics and try again.' };
    }

    // Convert the new format to match the expected format in the frontend
    const convertedOutput = {
      mcqQuestions: output.questions.map(q => ({
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty,
        type: q.type,
        numericRange: q.numericRange
      }))
    };

    return { success: true, data: convertedOutput };

  } catch (e: any) {
    console.error("generateQuizAction error:", e);
    // Provide more specific error messages for common issues.
    if (e.message?.includes('model is not found')) {
      return { success: false, error: `[AI Config Error] The specified model is not available. Please check the model name in the AI flow.` };
    }
    if (e.cause && e.cause.code === 'UND_ERR_CONNECT_FAILED') {
        return { success: false, error: 'Network Error: Could not connect to the AI service. Is the Genkit server running? (npm run genkit:dev)' };
    }
    // The error from a Genkit flow will have a message property.
    const errorMessage = e.message || "An unexpected error occurred while generating the quiz.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action to get an AI-generated explanation for a quiz question.
 *
 * @param {ExplainAnswerInput} input - The question, correct answer, incorrect answers, and stream.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>} An object with the explanation or an error.
 */
export async function getExplanationAction(input: ExplainAnswerInput) {
  try {
    const output = await explainAnswer(input);
    return { success: true, data: output };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to get explanation." };
  }
}

/**
 * Server Action to save a completed quiz to the user's history and update stats.
 *
 * @param {QuizHistoryItem} quizData - The data for the completed quiz.
 * @param {string} userEmail - The email of the user whose history is being saved.
 * @returns {Promise<{success: boolean, historyId?: string, error?: string}>} An object indicating success or failure.
 */
export async function saveQuizHistoryAction(quizData: QuizHistoryItem, userEmail: string) {
  try {
    await dbConnect();
    
    // Save quiz history
        // Ensure userAnswers is stored as an array matching the shared type
        const normalizedUserAnswers = Array.isArray(quizData.userAnswers)
            ? quizData.userAnswers
            : Object.keys(quizData.userAnswers || {}).map(k => (quizData.userAnswers as any)[k]);

        const quizToSave = { ...quizData, userEmail, userAnswers: normalizedUserAnswers };
    const newQuizHistory = new QuizHistory(quizToSave);
    const savedQuiz = await newQuizHistory.save();

    // Update user stats (gamification)
    const pointsEarned = quizData.score * 10; // 10 points per correct answer
    
    let stats = await (UserStats as any).findOne({ userEmail });
    if (!stats) {
        stats = new UserStats({ userEmail });
    }

    stats.points += pointsEarned;
    
    // Streak logic
    const today = new Date();
    if (stats.lastQuizDate) {
        const yesterday = subDays(today, 1);
        if (isSameDay(stats.lastQuizDate, yesterday)) {
            stats.currentStreak += 1;
        } else if (!isSameDay(stats.lastQuizDate, today)) {
            stats.currentStreak = 1; // Reset if they missed a day
        }
    } else {
        stats.currentStreak = 1; // First quiz
    }

    stats.lastQuizDate = today;
    if (stats.currentStreak > stats.longestStreak) {
        stats.longestStreak = stats.currentStreak;
    }
    
    // Badge logic (example)
    if (stats.points > 1000 && !stats.badges.includes("Point Collector")) {
        stats.badges.push("Point Collector");
    }
    if (stats.currentStreak >= 5 && !stats.badges.includes("5-Day Streak")) {
        stats.badges.push("5-Day Streak");
    }

    await stats.save();

    return { success: true, historyId: savedQuiz._id.toString() };
  } catch (e) {
    console.error("Failed to save quiz history", e);
    return { success: false, error: "Could not save quiz history to your account." };
  }
}

/**
 * Server Action to retrieve all past quizzes for a given user.
 *
 * @param {string} userEmail - The email of the user.
 * @returns {Promise<{success: boolean, data?: QuizHistoryItem[], error?: string}>} An object with the user's quiz history or an error.
 */
export async function getQuizHistoryAction(userEmail: string) {
    try {
        await dbConnect();
        // Find all history items for the user, sorted by most recent date.
        const history = await ((QuizHistory as any).find({ userEmail }).sort({ date: -1 }).lean().exec());
        
        console.log('Raw history from DB:', JSON.stringify(history, null, 2));
        
        // Convert mongoose documents to plain JavaScript objects for serialization.
        const plainHistory = history.map(item => {
            const userAnswersArray: (string | string[] | number)[] = 
              new Array(item.questions.length).fill(undefined);
            
            // Process each question's user answer based on the question type
            (item.questions || []).forEach((question: Question, index: number) => {
                // Handle both array and object formats of userAnswers
                let rawAnswer;
                if (Array.isArray(item.userAnswers)) {
                    rawAnswer = item.userAnswers[index];
                } else if (typeof item.userAnswers === 'object' && item.userAnswers !== null) {
                    rawAnswer = item.userAnswers[String(index)];
                }
                
                // Skip undefined/null answers
                if (rawAnswer === undefined || rawAnswer === null) {
                    return;
                }

                try {
                    switch (question.type) {
                        case 'MCQ':
                            // MCQ answers should be strings
                            userAnswersArray[index] = String(rawAnswer);
                            break;

                        case 'MSQ':
                            // MSQ answers should be string arrays
                            if (Array.isArray(rawAnswer)) {
                                userAnswersArray[index] = rawAnswer.map(String);
                            } else if (typeof rawAnswer === 'string') {
                                // Try parsing JSON first
                                try {
                                    const parsed = JSON.parse(rawAnswer);
                                    if (Array.isArray(parsed)) {
                                        userAnswersArray[index] = parsed.map(String);
                                    } else {
                                        // If not an array, split by commas
                                        userAnswersArray[index] = rawAnswer.split(',').map(s => s.trim()).filter(Boolean);
                                    }
                                } catch {
                                    // If JSON parse fails, split by commas
                                    userAnswersArray[index] = rawAnswer.split(',').map(s => s.trim()).filter(Boolean);
                                }
                            } else {
                                // Single answer, wrap in array
                                userAnswersArray[index] = [String(rawAnswer)];
                            }
                            break;

                        case 'NTQ':
                            // NTQ answers should be numbers
                            const num = Number(rawAnswer);
                            userAnswersArray[index] = Number.isNaN(num) ? 0 : num;
                            break;

                        default:
                            // Unknown type, store as string
                            userAnswersArray[index] = String(rawAnswer);
                    }
                } catch (e) {
                    console.error(`Error processing answer for question ${index}:`, e);
                    // On error, store as string to prevent crashes
                    userAnswersArray[index] = String(rawAnswer);
                }
            });

            return {
                ...item,
                _id: item._id.toString(),
                date: item.date.toISOString(),
                questions: item.questions.map(q => ({...q, timeTaken: q.timeTaken || 0})),
                userAnswers: userAnswersArray,
                totalTime: item.totalTime || 0,
            };

            // No additional runtime type conversion needed - we already handled types during initial processing
            
            return {
                ...item,
                _id: item._id.toString(), // Convert ObjectId to string
                date: item.date.toISOString(), // Convert Date to string
                questions: item.questions.map(q => ({...q, timeTaken: q.timeTaken || 0})),
                userAnswers: userAnswersArray,
                totalTime: item.totalTime || 0,
            };
        });

        return { success: true, data: plainHistory };
    } catch (e) {
        console.error("Failed to get quiz history", e);
        return { success: false, error: "Could not retrieve your quiz history." };
    }
}


/**
 * Server Action to analyze quiz performance.
 *
 * @param {AnalyzePerformanceInput} input - The data for the quiz performance analysis.
 * @returns {Promise<{success: boolean, data?: AnalyzePerformanceOutput, error?: string}>} An object with the analysis or an error.
 */
export async function analyzePerformanceAction(input: AnalyzePerformanceInput, historyId: string) {
  try {
    const output = await analyzePerformance(input);
    
    // Save the analysis to the specific quiz history item
    if (output) {
        await dbConnect();
        const errorTypeCounts = { conceptual: 0, careless: 0, misinterpretation: 0 };
        const updatedQuestions = input.quizResults.map(qr => {
            const analysis = output.errorAnalysis.find(ea => ea.question === qr.question);
            let errorType: string | undefined;
            if (qr.isCorrect) {
              errorType = 'Correct';
            } else if (analysis) {
              errorType = analysis.errorType;
              if (errorType === 'Conceptual') errorTypeCounts.conceptual++;
              if (errorType === 'Careless Slip') errorTypeCounts.careless++;
              if (errorType === 'Question Misinterpretation') errorTypeCounts.misinterpretation++;
            }
            return { ...qr, errorType };
        });

        const performanceAnalysis = {
            feedback: output.overallFeedback,
            weakestTopics: output.weakestTopics,
            errorTypes: errorTypeCounts,
        };

        await (QuizHistory as any).findByIdAndUpdate(historyId, { 
            $set: { 
                performanceAnalysis,
                'questions': updatedQuestions // This should update the errorType in the questions sub-array
            } 
        });
    }

    return { success: true, data: output };
  } catch (e: any) {
        // Log full details server-side for debugging (status, traceId, message if present)
        console.error("Performance analysis error:", {
            message: e?.message,
            status: e?.status,
            statusText: e?.statusText,
            errorDetails: e?.errorDetails,
            traceId: e?.traceId,
            stack: e?.stack,
        });

        // Return a friendly error message to the client. The client UI can show a retry option.
        return {
            success: false,
            error:
                e?.message?.includes('model is not found') || e?.status === 404
                    ? 'The AI model required for performance analysis is unavailable in this environment. Please try again later or contact support.'
                    : e.message || 'Failed to analyze performance.',
        };
  }
}

/**
 * Server Action to handle a chat message with the AI.
 *
 * @param {{ messages: Message[] }} input - The current conversation history.
 * @returns {Promise<{success: boolean, data?: {response: string}, error?: string}>} The AI's response or an error.
 */
export async function chatWithAIAction(input: { messages: Message[] }) {
    try {
        const output = await chatWithAI(input);
        return { success: true, data: output };
    } catch (e) {
        console.error("Chat with AI error", e);
        return { success: false, error: "Failed to get response from AI." };
    }
}

/**
 * Server Action to retrieve a user's chat history.
 *
 * @param {string} userEmail - The email of the user.
 * @returns {Promise<{success: boolean, data?: Message[], error?: string}>} The user's chat messages or an error.
 */
export async function getChatHistoryAction(userEmail: string) {
    try {
        await dbConnect();
    const history = await ((ChatHistory as any).findOne({ userEmail }).lean().exec());
        if (history) {
            return { success: true, data: history.messages };
        }
        return { success: true, data: [] }; // No history found, return empty array.
    } catch (e) {
        console.error("Failed to get chat history", e);
        return { success: false, error: "Could not retrieve your chat history." };
    }
}

/**
 * Server Action to save a user's chat history.
 * It uses `findOneAndUpdate` with `upsert: true` to either create a new history
 * or update an existing one.
 *
 * @param {string} userEmail - The user's email.
 * @param {Message[]} messages - The chat messages to save.
 * @returns {Promise<{success: boolean, error?: string}>} An object indicating success or failure.
 */
export async function saveChatHistoryAction(userEmail: string, messages: Message[]) {
    try {
        await dbConnect();
        await (ChatHistory as any).findOneAndUpdate(
            { userEmail },
            { messages },
            { upsert: true, new: true } // upsert: create if it doesn't exist, new: return the new doc
        );
        return { success: true };
    } catch (e) {
        console.error("Failed to save chat history", e);
        return { success: false, error: "Could not save your chat." };
    }
}

/**
 * Server Action to retrieve user statistics for the dashboard.
 *
 * @param {string} userEmail - The email of the user.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>} The user's stats or an error.
 */
export async function getDashboardStatsAction(userEmail: string) {
    try {
        await dbConnect();
    const stats = await ((UserStats as any).findOne({ userEmail }).lean().exec());
        const quizCount = await QuizHistory.countDocuments({ userEmail });

        const defaultStats = {
            points: 0,
            badges: [],
            currentStreak: 0,
            longestStreak: 0,
        };

        const plainStats = {
            quizCount: quizCount,
            points: stats?.points || defaultStats.points,
            badges: stats?.badges || defaultStats.badges,
            currentStreak: stats?.currentStreak || defaultStats.currentStreak,
            longestStreak: stats?.longestStreak || defaultStats.longestStreak,
        };

        return { success: true, data: plainStats };
    } catch (e) {
        console.error("Failed to get dashboard stats", e);
        return { success: false, error: "Could not retrieve your dashboard data." };
    }
}
