
/**
 * @fileOverview This file defines the Mongoose schema and model for storing chat history.
 * Each document in the `chatHistories` collection represents the entire conversation
 * for a single user.
 */

import mongoose, { Document, Schema, models, model } from 'mongoose';

/**
 * @interface IMessage
 * @description Defines the structure for a single message within the chat history.
 */
interface IMessage {
  role: 'user' | 'model';
  content: string;
}

/**
 * @interface IChatHistory
 * @description Defines the structure for a chat history document in MongoDB.
 * It extends the Mongoose `Document` interface.
 */
export interface IChatHistory extends Document {
  userEmail: string;
  messages: IMessage[];
}

/**
 * @const {Schema} MessageSchema
 * @description The Mongoose schema for an individual message. It is a sub-schema
 * used within the main `ChatHistorySchema`.
 */
const MessageSchema = new Schema({
    role: { type: String, enum: ['user', 'model'], required: true },
    content: { type: String, required: true },
}, { _id: false }); // _id is not needed for sub-documents.

/**
 * @const {Schema} ChatHistorySchema
 * @description The main Mongoose schema for the chat history document.
 */
const ChatHistorySchema: Schema = new Schema({
  userEmail: { type: String, required: true, unique: true, index: true },
  messages: { type: [MessageSchema], required: true },
});

// Export the model, creating it if it doesn't already exist.
export default models.ChatHistory || model<IChatHistory>('ChatHistory', ChatHistorySchema);
