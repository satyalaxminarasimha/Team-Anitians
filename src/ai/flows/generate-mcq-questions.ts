
'use server';

/**
 * @fileOverview This file defines an AI flow for generating multiple-choice questions (MCQs).
 * It uses a tool to fetch the user's past questions to ensure new questions are unique.
 * The flow is designed to be robust, ensuring the AI generates the exact number of questions
 * requested and adheres strictly to the provided syllabus.
 *
 * @exports generateMCQQuestions - The main function that invokes the question generation flow.
 * @exports GenerateMCQQuestionsInput - The Zod schema type for the generation flow's input.
 * @exports GenerateMCQQuestionsOutput - The Zod schema type for the generation flow's output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getPreviouslyAskedQuestions } from '../tools/paper-analysis-tools';
import { googleAI } from '@genkit-ai/googleai';

/**
 * @const {z.ZodObject} GenerateMCQQuestionsInputSchema
 * @description Schema for the data required to generate a quiz. This is what the client provides.
 */
const GenerateMCQQuestionsInputSchema = z.object({
  exam: z.string().describe('The exam the user is preparing for (e.g., GATE, JEE).'),
  engineeringStream: z
    .string()
    .describe('The selected engineering stream (e.g., Computer Science, Mechanical Engineering).'),
  syllabus: z.string().describe('The user-provided syllabus for the selected engineering stream.'),
  difficultyLevel: z
    .string()
    .describe('The difficulty level of the MCQs (e.g., Easy, Medium, Hard).'),
  numberOfQuestions: z.number().describe('The number of MCQs to generate.'),
  userEmail: z.string().email().describe("The email of the user requesting the quiz. This is used to avoid repeating questions."),
});
export type GenerateMCQQuestionsInput = z.infer<
  typeof GenerateMCQQuestionsInputSchema
>;

/**
 * @const {z.ZodObject} GenerateMCQQuestionsOutputSchema
 * @description Schema for the generated quiz questions that will be returned to the client.
 */
const GenerateMCQQuestionsOutputSchema = z.object({
  mcqQuestions: z.array(
    z.object({
      question: z.string().describe('The MCQ question.'),
      options: z.array(z.string()).describe('The options for the MCQ.'),
      correctAnswer: z.union([
        z.string(),
        z.array(z.string())
      ]).transform(val => Array.isArray(val) ? val.join(', ') : val)
        .describe('The correct answer to the MCQ. Can be a single string or array of strings.'),
      difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty level of the generated question.')
    })
  ).describe('The generated multiple-choice questions.'),
});
export type GenerateMCQQuestionsOutput = z.infer<
  typeof GenerateMCQQuestionsOutputSchema
>;

/**
 * Public-facing function that clients (e.g., Server Actions) will call to generate a quiz.
 *
 * @param {GenerateMCQQuestionsInput} input - The configuration for the quiz.
 * @returns {Promise<GenerateMCQQuestionsOutput>} A promise that resolves to the generated questions.
 */
export async function generateMCQQuestions(
  input: GenerateMCQQuestionsInput
): Promise<GenerateMCQQuestionsOutput> {
  return generateMCQQuestionsFlow(input);
}


/**
 * @const {z.ZodObject} AgentPromptInputSchema
 * @description Internal schema used for the AI prompt. It extends the client-facing input
 * with a list of previously asked questions to ensure uniqueness.
 */
const AgentPromptInputSchema = GenerateMCQQuestionsInputSchema.extend({
    previouslyAskedQuestions: z.array(z.string()).describe("A list of questions the user has already been asked and should not be repeated."),
});

/**
 * @const {Prompt} prompt
 * @description The AI prompt that instructs the model on how to generate the questions.
 * It is explicitly given the `getPreviouslyAskedQuestions` tool and includes strict
 * instructions on adhering to the syllabus, question count, and uniqueness.
 */
const prompt = ai.definePrompt({
  name: 'generateMCQQuestionsAgent',
  model: googleAI.model('gemini-2.0-flash'),
  input: {schema: AgentPromptInputSchema},
  output: {schema: GenerateMCQQuestionsOutputSchema},
  tools: [getPreviouslyAskedQuestions],
  prompt: `You are an expert Question Crafter AI for the {{{engineeringStream}}} stream of the {{{exam}}} exam.

Your goal is to create a set of high-quality, original multiple-choice questions based on the provided syllabus topics.

**Overall Difficulty Level for the quiz:** {{{difficultyLevel}}}
**Number of Questions to Generate:** {{{numberOfQuestions}}}

**Syllabus Provided by User (Source of Truth for Topics):**
<SYLLABUS>
{{{syllabus}}}
</SYLLABUS>

**Previously Asked Questions (CRITICAL: Do NOT repeat any of these questions):**
{{#if previouslyAskedQuestions.length}}
{{#each previouslyAskedQuestions}}
- {{{this}}}
{{/each}}
{{else}}
None
{{/if}}

**Mandatory Instructions:**

1.  **Generate the Exact Number of Questions**: You MUST generate exactly {{{numberOfQuestions}}} unique, original multiple-choice questions. This is not a suggestion; it is a strict requirement. Failure to produce the exact number will result in a failed task.
2.  **Avoid Repetition**: The questions you generate MUST NOT be in the 'Previously Asked Questions' list. This is the most important rule.
3.  **Adhere to Syllabus**: The questions MUST be relevant to the topics listed in the provided syllabus.
4.  **Formatting**: Each question must have exactly four options. The 'correctAnswer' must be one of the provided options.
5.  **Difficulty**: Assign a 'difficulty' ('Easy', 'Medium', 'Hard') to each question that is consistent with the overall quiz difficulty.
`,
});

/**
 * Shuffles the elements of an array in place.
 * Uses the Fisher-Yates (aka Knuth) shuffle algorithm.
 *
 * @template T
 * @param {T[]} array - The array to shuffle.
 * @returns {T[]} The shuffled array.
 */
function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * @const {Flow} generateMCQQuestionsFlow
 * @description The main Genkit flow that orchestrates the question generation process.
 * 1. Fetches the user's past questions using the `getPreviouslyAskedQuestions` tool.
 * 2. Calls the AI prompt with the user's config and question history, with a retry mechanism.
 * 3. Validates the AI's output to ensure the correct number of questions was generated.
 * 4. Shuffles the options for each question to randomize answer positions.
 *
 * @param {GenerateMCQQuestionsInput} input - The initial configuration from the client.
 * @returns {Promise<GenerateMCQQuestionsOutput>} The validated and shuffled quiz questions.
 * @throws {Error} If the AI fails to generate the correct number of questions after multiple attempts.
 */
export const generateMCQQuestionsFlow = ai.defineFlow(
  {
    name: 'generateMCQQuestionsFlow',
    inputSchema: GenerateMCQQuestionsInputSchema,
    outputSchema: GenerateMCQQuestionsOutputSchema,
  },
  async (input) => {
    
    console.log(`[generateMCQQuestionsFlow] Starting for user ${input.userEmail}`);

    // Step 1: Call the tool to get the user's question history.
    const historyResult = await getPreviouslyAskedQuestions({ userEmail: input.userEmail });
    const previouslyAskedQuestions = historyResult.previouslyAskedQuestions;
    console.log(`[generateMCQQuestionsFlow] Found ${previouslyAskedQuestions.length} previously asked questions.`);
    
    let output: GenerateMCQQuestionsOutput | null = null;
    const maxRetries = 5;

    // Step 2: Call the AI prompt, providing all necessary context, with a retry loop.
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`[generateMCQQuestionsFlow] Calling AI prompt, attempt ${attempt}...`);
        const response = await prompt({
            ...input,
            previouslyAskedQuestions,
        });

        if (response.output && response.output.mcqQuestions && response.output.mcqQuestions.length === input.numberOfQuestions) {
            output = response.output;
            console.log(`[generateMCQQuestionsFlow] Successfully generated ${output.mcqQuestions.length} questions on attempt ${attempt}.`);
            break; // Exit loop on success
        } else {
            console.warn(`[generateMCQQuestionsFlow] Attempt ${attempt} failed. AI generated ${response.output?.mcqQuestions?.length || 0} of ${input.numberOfQuestions} questions.`);
        }
    }
    
    if (!output || !output.mcqQuestions || output.mcqQuestions.length !== input.numberOfQuestions) {
      console.error(`[generateMCQQuestionsFlow] AI failed to generate the requested number of questions after ${maxRetries} attempts.`);
      throw new Error(`The AI failed to generate the requested ${input.numberOfQuestions} questions. Please try modifying your syllabus topics and try again.`);
    }

    // Step 3: Shuffle the options for each question to randomize the correct answer position.
    const shuffledQuestions = output.mcqQuestions.map(q => {
        if (!Array.isArray(q.options) || q.options.length < 2) {
            console.warn("[generateMCQQuestionsFlow] Received invalid options from AI, providing defaults.", q);
            return {
                ...q,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: 'Option A' // Assign a default correct answer
            };
        }
        return {
            ...q,
            options: shuffleArray([...q.options]), // Create a new array to shuffle
        };
    });
    
    console.log(`[generateMCQQuestionsFlow] Successfully generated and validated ${shuffledQuestions.length} questions.`);
    return { mcqQuestions: shuffledQuestions };
  }
);
