
'use server';
/**
 * @fileOverview Defines tools for the AI agent to interact with application data.
 * These tools allow the AI to perform specific, isolated actions such as querying a
 * database. They are made available to AI flows and can be invoked by the model
 * when it determines they are necessary to fulfill a user's request.
 *
 * @exports findRelevantPaperChunks - A tool to find text chunks from past exam papers.
 * @exports getPreviouslyAskedQuestions - A tool to retrieve a user's quiz history.
 */

import { ai } from '@/ai/genkit';
import dbConnect from '@/lib/db-connect';
import PaperChunk from '@/models/paper-chunk.model';
import QuizHistory from '@/models/quiz-history.model';
import { z } from 'zod';

/**
 * @const {z.ZodObject} FindRelevantPaperChunksInputSchema
 * @description Zod schema for the input of the `findRelevantPaperChunks` tool.
 */
const FindRelevantPaperChunksInputSchema = z.object({
  query: z.string().describe('The topic or query to search for in the past paper database.'),
  stream: z.string().describe('The engineering stream to limit the search to.'),
  exam: z.string().describe('The exam to limit the search to.'),
  limit: z.number().optional().default(5).describe('The maximum number of relevant chunks to return.'),
});

/**
 * @const {z.ZodObject} FindRelevantPaperChunksOutputSchema
 * @description Zod schema for the output of the `findRelevantPaperChunks` tool.
 */
const FindRelevantPaperChunksOutputSchema = z.object({
    chunks: z.array(z.object({
        source: z.string(),
        content: z.string(),
    }))
});

/**
 * @const {AITool} findRelevantPaperChunks
 * @description An AI tool that finds relevant text chunks from a MongoDB collection
 * of past exam papers using vector similarity search.
 *
 * This tool performs the following steps:
 * 1. Generates a vector embedding for the search query.
 * 2. Executes a MongoDB aggregation pipeline to perform a `$vectorSearch`.
 * 3. Filters the results by `stream` and `exam`.
 * 4. Projects the results into the required output format.
 *
 * @param {z.infer<typeof FindRelevantPaperChunksInputSchema>} input - The search query, stream, exam, and limit.
 * @returns {Promise<z.infer<typeof FindRelevantPaperChunksOutputSchema>>} A promise resolving to an array of relevant chunks.
 */
export const findRelevantPaperChunks = ai.defineTool(
  {
    name: 'findRelevantPaperChunks',
    description: 'Finds and returns relevant text chunks from a database of past exam papers based on a search query.',
    inputSchema: FindRelevantPaperChunksInputSchema,
    outputSchema: FindRelevantPaperChunksOutputSchema,
  },
  async (input) => {
    await dbConnect();

    // 1. Generate an embedding for the user's query
    // genkit typings may not match runtime; cast to any and extract embedding defensively
    const embedResult: any = await (ai as any).embed({
      model: 'googleai/text-embedding-004',
      content: input.query,
    });
    const queryEmbedding: number[] = embedResult?.embedding ?? embedResult?.[0]?.embedding ?? [];

      // 2. Perform a vector search (similarity search) in MongoDB
      // This pipeline first performs the vector search and then filters the results.
      const relevantChunks = await PaperChunk.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100, // Increase candidates to improve accuracy before filtering
          limit: input.limit * 2, // Fetch more results to filter from
        },
      },
      {
        $match: {
            stream: input.stream,
            exam: input.exam,
        }
      },
      {
        $limit: input.limit
      },
      {
        $project: {
          _id: 0,
          source: 1,
          content: '$chunk',
          score: { $meta: 'vectorSearchScore' },
        },
      },
  ]);

  if (!relevantChunks || relevantChunks.length === 0) {
        return { chunks: [] };
    }

    return {
        chunks: relevantChunks.map(c => ({ source: c.source, content: c.content }))
    };
  }
);


/**
 * @const {z.ZodObject} GetPreviouslyAskedQuestionsInputSchema
 * @description Zod schema for the input of the `getPreviouslyAskedQuestions` tool.
 */
const GetPreviouslyAskedQuestionsInputSchema = z.object({
    userEmail: z.string().email().describe("The user's email to look up their quiz history."),
});

/**
 * @const {z.ZodObject} GetPreviouslyAskedQuestionsOutputSchema
 * @description Zod schema for the output of the `getPreviouslyAskedQuestions` tool.
 */
const GetPreviouslyAskedQuestionsOutputSchema = z.object({
    previouslyAskedQuestions: z.array(z.string()).describe("A list of questions the user has been asked before."),
});

/**
 * @const {AITool} getPreviouslyAskedQuestions
 * @description An AI tool that retrieves a list of all unique questions a user has
 * encountered in their past quizzes. This is crucial for ensuring that the AI
 * does not generate duplicate questions for the same user.
 *
 * @param {z.infer<typeof GetPreviouslyAskedQuestionsInputSchema>} input - The user's email.
 * @returns {Promise<z.infer<typeof GetPreviouslyAskedQuestionsOutputSchema>>} A promise resolving to a list of question strings.
 */
export const getPreviouslyAskedQuestions = ai.defineTool(
    {
        name: 'getPreviouslyAskedQuestions',
        description: "Retrieves a list of all questions a user has previously been asked in quizzes.",
        inputSchema: GetPreviouslyAskedQuestionsInputSchema,
        outputSchema: GetPreviouslyAskedQuestionsOutputSchema,
    },
    async (input) => {
        await dbConnect();
        
  // cast to any and use exec to satisfy types and return actual documents
  const userHistory: any[] = await ((QuizHistory as any).find({ userEmail: input.userEmail }) as any).lean().exec();
        
        if (!userHistory || userHistory.length === 0) {
            return { previouslyAskedQuestions: [] };
        }
        
        // Flatten the array of history items to get a single array of all questions.
        const allQuestions = userHistory.flatMap(historyItem => 
            historyItem.questions.map(q => q.question)
        );

        // Deduplicate questions to create a unique set.
        const uniqueQuestions = [...new Set(allQuestions)];

        return { previouslyAskedQuestions: uniqueQuestions };
    }
);
