/**
 * @fileOverview This file defines the Mongoose schema and model for storing
 * chunks of text from exam papers, along with their vector embeddings.
 * This model is not currently used in the application but is designed for
 * future functionality related to searching past papers.
 */
import mongoose, { Document, Schema, models, model } from 'mongoose';

/**
 * @interface IPaperChunk
 * @description Defines the structure for a paper chunk document in MongoDB.
 */
export interface IPaperChunk extends Document {
  exam: string;
  stream: string;
  source: string; // e.g., the filename or URL of the paper
  chunk: string;  // The text content of the chunk
  embedding: number[]; // The vector embedding of the chunk
}

/**
 * @const {Schema} PaperChunkSchema
 * @description The Mongoose schema for the paper chunk document.
 */
const PaperChunkSchema: Schema = new Schema({
  exam: { type: String, required: true, index: true },
  stream: { type: String, required: true, index: true },
  source: { type: String, required: true },
  chunk: { type: String, required: true },
  embedding: { type: [Number], required: true },
});

/**
 * Defines a `2dsphere` index on the `embedding` field. This is a placeholder
 * for a proper vector search index which is a specific feature of MongoDB Atlas.
 * This index is necessary for performing efficient similarity searches.
 */
PaperChunkSchema.index({ embedding: '2dsphere' });

// Export the model, creating it if it doesn't already exist.
export default models.PaperChunk || model<IPaperChunk>('PaperChunk', PaperChunkSchema);
