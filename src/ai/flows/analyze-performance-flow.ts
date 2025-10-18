
'use server';

/**
 * @fileOverview This file defines an AI flow for analyzing a user's quiz performance.
 * It takes the details of a completed quiz, identifies weak areas, categorizes errors,
 * and provides personalized strategic feedback.
 *
 * @exports analyzePerformance - The main function that invokes the performance analysis flow.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { AnalyzePerformanceInputSchema, AnalyzePerformanceOutputSchema, type AnalyzePerformanceInput, type AnalyzePerformanceOutput } from '@/app/lib/types';


/**
 * Public-facing function that clients will call to analyze performance.
 *
 * @param {AnalyzePerformanceInput} input - The performance data.
 * @returns {Promise<AnalyzePerformanceOutput>} A promise that resolves to the generated analysis.
 */
export async function analyzePerformance(
  input: AnalyzePerformanceInput
): Promise<AnalyzePerformanceOutput> {
  return analyzePerformanceFlow(input);
}

/**
 * @const {Prompt} prompt
 * @description The AI prompt that instructs the model on how to analyze the quiz results.
 */
const prompt = ai.definePrompt({
  name: 'analyzePerformancePrompt',
  model: googleAI.model('gemini-1.0-pro'),
  input: { schema: AnalyzePerformanceInputSchema },
  output: { schema: AnalyzePerformanceOutputSchema },
  prompt: `You are an expert AI Exam Coach for a student preparing for the {{{exam}}} in the {{{stream}}} stream.
The user has just completed a quiz. Your task is to provide a deep, personalized analysis of their performance.

User's Inferred Learning Style: {{{inferredLearningStyle}}} (Tailor your feedback accordingly. For 'visual' learners, suggest diagrams. For 'code-first', suggest practical examples. For 'needs-confidence', be extra encouraging.)

Here are the quiz results:
{{#each quizResults}}
---
Question {{add @index 1}}: {{{question}}}
Topic: {{{topic}}}
Difficulty: {{{difficulty}}}
Time Taken: {{{timeTaken}}} seconds
User's Answer: {{{userAnswer}}}
Correct Answer: {{{correctAnswer}}}
Result: {{#if isCorrect}}Correct{{else}}Incorrect{{/if}}
{{/each}}
---

**Your Tasks:**

1.  **Categorize Errors**: For each INCORRECT answer, analyze the potential reason for the mistake and classify it into one of three categories:
    *   **Conceptual Error**: The user likely doesn't understand the underlying concept or formula.
    *   **Careless Slip**: The user likely understood the concept but made a calculation mistake, misread the question, or made a simple error. Look for signs like being close to the right answer or taking very little time on a hard question.
    *   **Question Misinterpretation**: The user understood the concept but misinterpreted what the question was asking for.

2.  **Identify Weak Topics**: Based on the incorrect answers, identify the top 2-3 topics or sub-topics where the user is struggling the most.

3.  **Provide Actionable Feedback**: Write a concise, encouraging, and actionable summary. This is the most important part.
    *   Start with a positive reinforcement.
    *   Clearly state the identified weak topics.
    *   Provide strategic advice based on the error patterns and time management. For example: "I noticed a pattern of 'Careless Slips' in Thermodynamics questions. Double-checking your calculations could significantly boost your score." or "You're spending a lot of time on Algorithm questions. Let's focus on practicing foundational problems to improve your speed."
    *   Tailor suggestions to the user's learning style.
    *   Keep it encouraging and forward-looking.
`,
});

/**
 * @const {Flow} analyzePerformanceFlow
 * @description The main Genkit flow that orchestrates the performance analysis.
 * @param {AnalyzePerformanceInput} input - The quiz results.
 * @returns {Promise<AnalyzePerformanceOutput>} The generated analysis.
 */
export const analyzePerformanceFlow = ai.defineFlow(
  {
    name: 'analyzePerformanceFlow',
    inputSchema: AnalyzePerformanceInputSchema,
    outputSchema: AnalyzePerformanceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI failed to generate a performance analysis.');
    }
    return output;
  }
);
