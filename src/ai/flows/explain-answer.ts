
'use server';

/**
 * @fileOverview Explains the correct answer to a multiple-choice question and why the other options are incorrect.
 * This file defines a Genkit flow that receives a question, its correct answer, and incorrect options,
 * and generates a detailed explanation suitable for a student.
 *
 * @exports explainAnswer - An asynchronous function to invoke the explanation flow.
 * @exports ExplainAnswerInput - The Zod schema type for the function's input.
 * @exports ExplainAnswerOutput - The Zod schema type for the function's output.
 */

import {ai} from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {z} from 'genkit';

/**
 * @const {z.ZodObject} ExplainAnswerInputSchema
 * @description The Zod schema for validating the input to the explanation flow.
 * It requires the question, correct answer, incorrect answers, and the relevant engineering stream.
 */
const ExplainAnswerInputSchema = z.object({
  question: z.string().describe('The multiple-choice question.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
  incorrectAnswers: z
    .array(z.string())
    .describe('An array of incorrect answers to the question.'),
  engineeringStream: z
    .string()
    .describe(
      'The engineering stream for which the question is intended (e.g., Computer Science, Mechanical Engineering).'
    ),
});
export type ExplainAnswerInput = z.infer<typeof ExplainAnswerInputSchema>;

/**
 * @const {z.ZodObject} ExplainAnswerOutputSchema
 * @description The Zod schema for validating the output of the explanation flow.
 * It ensures the output is an object with a single `explanation` string.
 */
const ExplainAnswerOutputSchema = z.object({
  explanation: z
    .string()
    .describe(
      'A detailed, step-by-step explanation of the correct answer and why the other options are incorrect.'
    ),
});
export type ExplainAnswerOutput = z.infer<typeof ExplainAnswerOutputSchema>;

/**
 * Public-facing wrapper function that invokes the explainAnswer Genkit flow.
 *
 * @param {ExplainAnswerInput} input - The question and answer details.
 * @returns {Promise<ExplainAnswerOutput>} A promise that resolves to the generated explanation.
 */
export async function explainAnswer(
  input: ExplainAnswerInput
): Promise<ExplainAnswerOutput> {
  return explainAnswerFlow(input);
}

/**
 * @const {Prompt} prompt
 * @description A Genkit prompt that instructs the AI to act as an expert tutor
 * and provide a detailed explanation for a given MCQ.
 */
const prompt = ai.definePrompt({
  name: 'explainAnswerPrompt',
  model: googleAI.model('gemini-2.0-flash'),
  input: {schema: ExplainAnswerInputSchema},
  output: {schema: ExplainAnswerOutputSchema},
  prompt: `You are an expert exam tutor for {{{engineeringStream}}}.

Your task is to provide a detailed, step-by-step explanation for the correct answer to the following question.

First, explain the correct answer in detail.
Then, for each of the incorrect answers, explain precisely why it is wrong.

Question: {{{question}}}
Correct Answer: {{{correctAnswer}}}
Incorrect Answers: {{{incorrectAnswers}}}

Provide a clear, concise, and easy-to-understand explanation.`,
});

/**
 * @const {Flow} explainAnswerFlow
 * @description The main Genkit flow for generating answer explanations.
 * It takes the input, calls the defined prompt, and returns the structured output.
 *
 * @param {ExplainAnswerInput} input - The validated input object.
 * @returns {Promise<ExplainAnswerOutput>} A promise that resolves to the explanation.
 */
export const explainAnswerFlow = ai.defineFlow(
  {
    name: 'explainAnswerFlow',
    inputSchema: ExplainAnswerInputSchema,
    outputSchema: ExplainAnswerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
