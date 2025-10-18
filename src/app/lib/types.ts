
import { z } from 'zod';

const QuestionResultSchema = z.object({
    question: z.string(),
    userAnswer: z.string().optional(),
    correctAnswer: z.string(),
    isCorrect: z.boolean(),
    timeTaken: z.number().describe("Time taken in seconds for this question."),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']),
    topic: z.string().optional().describe("The primary topic of the question."),
});

/**
 * @const {z.ZodObject} AnalyzePerformanceInputSchema
 * @description Schema for the data required to analyze a user's performance.
 */
export const AnalyzePerformanceInputSchema = z.object({
  exam: z.string(),
  stream: z.string(),
  quizResults: z.array(QuestionResultSchema),
  inferredLearningStyle: z.string().optional().describe("The user's inferred learning style (e.g., visual, code-first)."),
});
export type AnalyzePerformanceInput = z.infer<typeof AnalyzePerformanceInputSchema>;

/**
 * @const {z.ZodObject} AnalyzePerformanceOutputSchema
 * @description Schema for the generated performance analysis.
 */
export const AnalyzePerformanceOutputSchema = z.object({
    overallFeedback: z.string().describe("Actionable, personalized feedback for the user based on their performance, tailored to their learning style. Include strategic advice on both subject knowledge and exam-taking strategy (e.g., time management, error patterns)."),
    weakestTopics: z.array(z.string()).describe("A list of the most critical topics the user needs to work on, identified from incorrect answers."),
    errorAnalysis: z.array(z.object({
        question: z.string(),
        errorType: z.enum(['Conceptual', 'Careless Slip', 'Question Misinterpretation']).describe("The categorized reason for the user's mistake."),
    })).describe("An analysis of each incorrect answer, categorized by error type."),
});
export type AnalyzePerformanceOutput = z.infer<typeof AnalyzePerformanceOutputSchema>;
