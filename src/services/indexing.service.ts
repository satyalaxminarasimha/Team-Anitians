'use server';
/**
 * @fileOverview This file contains services for indexing document content.
 * It is not currently used in the main application flow but provides the
 * logic for chunking text, generating embeddings, and storing them in MongoDB.
 * This would be used for features like "Ask questions about a PDF".
 */
import { ai } from '@/ai/genkit';
import dbConnect from '@/lib/db-connect';
import PaperChunk from '@/models/paper-chunk.model';

/**
 * Splits a large text into smaller, overlapping chunks.
 * This is a simple chunking strategy. More sophisticated strategies (e.g., recursive
 * character splitting) could be used for better semantic chunking.
 *
 * @param {string} text - The input text to chunk.
 * @param {number} [chunkSize=1000] - The maximum size of each chunk.
 * @param {number} [overlap=100] - The number of characters to overlap between chunks.
 * @returns {string[]} An array of text chunks.
 */
function chunkText(text: string, chunkSize = 1000, overlap = 100): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Generates vector embeddings for an array of text chunks using a Genkit model.
 *
 * @param {string[]} chunks - An array of text chunks.
 * @returns {Promise<number[][]>} A promise that resolves to an array of embeddings.
 */
async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (const chunk of chunks) {
    const embedRes: any = await (ai as any).embed({ model: 'googleai/text-embedding-004', content: chunk });
    const emb: number[] = embedRes?.embedding ?? embedRes?.[0]?.embedding ?? [];
    embeddings.push(emb);
  }
  return embeddings;
}

/**
 * Processes and stores the text content of a document (e.g., a PDF).
 * This function is intended to be called by a server action after a client
 * has uploaded and extracted text from a file.
 *
 * @param {string} textContent - The full text content of the document.
 * @param {string} exam - The exam associated with the document.
 * @param {string} stream - The stream/subject associated with the document.
 * @param {string} source - An identifier for the document (e.g., filename).
 * @returns {Promise<{success: boolean, message: string}>} An object indicating the result of the operation.
 */
export async function indexPDFContent(
    textContent: string,
    exam: string,
    stream: string,
    source: string,
) {
  await dbConnect();

  console.log(`Indexing content for "${stream}" from source "${source}"...`);

  // 1. Chunk the text
  const chunks = chunkText(textContent);
  console.log(`Split content into ${chunks.length} chunks.`);

  // 2. Generate embeddings for each chunk
  const embeddings = await generateEmbeddings(chunks);
  console.log('Generated embeddings for all chunks.');

  // 3. Store chunks and their corresponding embeddings in MongoDB
  const paperChunkDocuments = chunks.map((chunk, index) => ({
    exam,
    stream,
    source,
    chunk,
    embedding: embeddings[index],
  }));

  await (PaperChunk as any).insertMany(paperChunkDocuments as any);
  console.log(`Successfully stored ${paperChunkDocuments.length} chunks for "${stream}" from "${source}".`);

  return { success: true, message: `Successfully indexed ${source}` };
}
