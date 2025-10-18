'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getPreviouslyAskedQuestions } from '../tools/paper-analysis-tools';
import { googleAI } from '@genkit-ai/googleai';

const GenerateQuizQuestionsInputSchema = z.object({
  exam: z.string().describe('The exam the user is preparing for (e.g., GATE, JEE).'),
  engineeringStream: z
    .string()
    .describe('The selected engineering stream (e.g., Computer Science, Mechanical Engineering).'),
  syllabus: z.string().describe('The user-provided syllabus for the selected engineering stream.'),
  difficultyLevel: z
    .string()
    .describe('The difficulty level of the questions (e.g., Easy, Medium, Hard).'),
  numberOfQuestions: z.number().describe('The total number of questions to generate.'),
  userEmail: z.string().email().describe("The email of the user requesting the quiz."),
});
export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

const QuestionSchema = z.object({
  question: z.string().describe('The question text.'),
  type: z.enum(['MCQ', 'MSQ', 'NTQ']).describe('The type of question: MCQ (single correct), MSQ (multiple correct), or NTQ (numerical).'),
  options: z.array(z.string()).optional().describe('The options for MCQ/MSQ questions.'),
  correctAnswer: z.union([
    z.string(),
    z.array(z.string()),
    z.number()
  ]).describe('The correct answer. String for MCQ, array of strings for MSQ, number for NTQ.'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty level of the question.'),
  numericRange: z.object({
    min: z.number(),
    max: z.number()
  }).optional().describe('For NTQ, the acceptable range of answers.')
});

const GenerateQuizQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema).describe('The generated quiz questions.'),
});
export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;

export async function generateQuizQuestions(
  input: GenerateQuizQuestionsInput
): Promise<GenerateQuizQuestionsOutput> {
  return generateQuizQuestionsFlow(input);
}

const AgentPromptInputSchema = GenerateQuizQuestionsInputSchema.extend({
  previouslyAskedQuestions: z.array(z.string()).describe("Previously asked questions to avoid repetition."),
});

const prompt = ai.definePrompt({
  name: 'generateQuizQuestionsAgent',
  model: googleAI.model('gemini-2.0-flash'),
  input: {schema: AgentPromptInputSchema},
  output: {schema: GenerateQuizQuestionsOutputSchema},
  tools: [getPreviouslyAskedQuestions],
  prompt: `You are an expert Question Crafter AI for the {{{engineeringStream}}} stream of the {{{exam}}} exam.

Your goal is to create a diverse set of high-quality questions based on the provided syllabus topics.

**Overall Difficulty Level:** {{{difficultyLevel}}}
**Number of Questions to Generate:** {{{numberOfQuestions}}}

**Question Types Distribution:**
- MCQ (Single Correct): ~40% of questions
- MSQ (Multiple Correct): ~30% of questions
- NTQ (Numerical Type): ~30% of questions

**Syllabus:**
<SYLLABUS>
{{{syllabus}}}
</SYLLABUS>

**Previously Asked Questions (DO NOT REPEAT):**
{{#if previouslyAskedQuestions.length}}
{{#each previouslyAskedQuestions}}
- {{{this}}}
{{/each}}
{{else}}
None
{{/if}}

**Mandatory Instructions:**

1. Generate exactly {{{numberOfQuestions}}} unique questions with a mix of types (MCQ, MSQ, NTQ).
2. For MCQs:
   - Provide exactly 4 options
   - Only one correct answer
   - correctAnswer should be a string matching one option

3. For MSQs:
   - Provide exactly 4 options
   - Multiple correct answers (2-3)
   - correctAnswer should be an array of correct option strings

4. For NTQs:
   - No options required
   - correctAnswer should be a number
   - Include numericRange with min/max acceptable values
   - Questions should require calculation

5. All questions must:
   - Be unique and not in previouslyAskedQuestions
   - Be based on the provided syllabus
   - Have appropriate difficulty marking

Format each question precisely according to the schema, maintaining all required fields for each type.`,
});

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export const generateQuizQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuizQuestionsFlow',
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsOutputSchema,
  },
  async (input) => {
    console.log(`[generateQuizQuestionsFlow] Starting for user ${input.userEmail}`);

    const historyResult = await getPreviouslyAskedQuestions({ userEmail: input.userEmail });
    const previouslyAskedQuestions = historyResult.previouslyAskedQuestions;
    console.log(`[generateQuizQuestionsFlow] Found ${previouslyAskedQuestions.length} previously asked questions.`);
    
    let output: GenerateQuizQuestionsOutput | null = null;
    const maxRetries = 5;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`[generateQuizQuestionsFlow] Calling AI prompt, attempt ${attempt}...`);
        const response = await prompt({
            ...input,
            previouslyAskedQuestions,
        });

        if (response.output?.questions?.length === input.numberOfQuestions) {
            output = response.output;
            console.log(`[generateQuizQuestionsFlow] Successfully generated ${output.questions.length} questions on attempt ${attempt}.`);
            break;
        } else {
            console.warn(`[generateQuizQuestionsFlow] Attempt ${attempt} failed. Generated ${response.output?.questions?.length || 0} of ${input.numberOfQuestions} questions.`);
        }
    }
    
    if (!output?.questions || output.questions.length !== input.numberOfQuestions) {
      console.error(`[generateQuizQuestionsFlow] Failed to generate questions after ${maxRetries} attempts.`);
      throw new Error(`Failed to generate ${input.numberOfQuestions} questions. Please try modifying your syllabus topics.`);
    }

    // Shuffle options for MCQ and MSQ questions
    const processedQuestions = output.questions.map(q => {
        if ((q.type === 'MCQ' || q.type === 'MSQ') && Array.isArray(q.options)) {
            return {
                ...q,
                options: shuffleArray([...q.options])
            };
        }
        return q;
    });
    
    console.log(`[generateQuizQuestionsFlow] Successfully generated and processed ${processedQuestions.length} questions.`);
    return { questions: processedQuestions };
  }
);