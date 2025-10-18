
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
// Allow configuring the primary model and a comma-separated fallback list via env vars.
const PRIMARY_MODEL = process.env.GENKIT_MODEL || process.env.GOOGLEAI_MODEL || 'gemini-2.0-flash';
const FALLBACK_MODELS = (process.env.GENKIT_FALLBACK_MODELS || process.env.GOOGLEAI_FALLBACK_MODELS || 'gemini-2.0')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const prompt = ai.definePrompt({
  name: 'analyzePerformancePrompt',
  model: googleAI.model(PRIMARY_MODEL),
  input: { schema: AnalyzePerformanceInputSchema },
  output: { schema: AnalyzePerformanceOutputSchema },
  prompt: `You are an expert AI Exam Coach for a student preparing for the {{{exam}}} in the {{{stream}}} stream.
The user has just completed a quiz. Your task is to provide a deep, personalized analysis of their performance.

User's Inferred Learning Style: {{{inferredLearningStyle}}} (Tailor your feedback accordingly. For 'visual' learners, suggest diagrams. For 'code-first', suggest practical examples. For 'needs-confidence', be extra encouraging.)

Here are the quiz results:
{{#each quizResults}}
---
Question {{number}}: {{{question}}}
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
    // Try the primary prompt first. If the selected model is unavailable, attempt configured fallbacks.
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('The AI failed to generate a performance analysis.');
      }
      return output;
    } catch (e: any) {
      const msg = String(e?.message || e);
      // If the error is model-not-found or unsupported, iterate fallbacks.
      if (msg.includes('model is not found') || msg.includes('not found') || msg.includes('is not supported')) {
        for (const fallbackModel of FALLBACK_MODELS) {
          try {
            const fallbackPrompt = ai.definePrompt({
              name: `analyzePerformancePrompt_fallback_${fallbackModel}`,
              model: googleAI.model(fallbackModel),
              input: { schema: AnalyzePerformanceInputSchema },
              output: { schema: AnalyzePerformanceOutputSchema },
              prompt: `You are an expert AI Exam Coach for a student preparing for the {{{exam}}} in the {{{stream}}} stream.
The user has just completed a quiz. Your task is to provide a deep, personalized analysis of their performance.

User's Inferred Learning Style: {{{inferredLearningStyle}}} (Tailor your feedback accordingly.)

Here are the quiz results:
{{#each quizResults}}
---
Question {{number}}: {{{question}}}
Topic: {{{topic}}}
Difficulty: {{{difficulty}}}
Time Taken: {{{timeTaken}}} seconds
User's Answer: {{{userAnswer}}}
Correct Answer: {{{correctAnswer}}}
Result: {{#if isCorrect}}Correct{{else}}Incorrect{{/if}}
{{/each}}
---

Provide a categorized error analysis and actionable summary based on the results.
`,
            });

            const { output } = await fallbackPrompt(input);
            if (!output) throw new Error(`Fallback model ${fallbackModel} failed to generate analysis.`);
            return output;
          } catch (fallbackErr: any) {
            // try next fallback
            continue;
          }
        }

        // If none of the fallbacks worked, surface the original error with hint.
        throw new Error(`${msg} — attempted fallbacks: ${FALLBACK_MODELS.join(', ')}`);
      }

      // Not a model-availability error — rethrow so caller handles/logs it.
      throw e;
    }
  }
);
