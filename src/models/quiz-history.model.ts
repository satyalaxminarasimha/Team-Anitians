
/**
 * @fileOverview This file defines the Mongoose schema and model for storing
 * the results of completed quizzes for each user.
 */

import mongoose, { Document, Schema, models, model } from 'mongoose';
import type { QuizConfig, Question, UserAnswers } from '@/components/gate-ai-prep';

/**
 * @interface IQuizHistory
 * @description Defines the structure for a quiz history document in MongoDB.
 */
export interface IQuizHistory extends Document {
  userEmail: string;
  date: Date;
  config: QuizConfig;
  questions: Question[];
  userAnswers: UserAnswers;
  score: number;
  totalTime: number; // Total time in seconds
  performanceAnalysis?: {
    feedback: string;
    weakestTopics: string[];
    errorTypes: { conceptual: number; careless: number; misinterpretation: number };
  };
}

/**
 * @const {Schema} QuizConfigSchema
 * @description A sub-schema for storing the configuration of the quiz.
 */
const QuizConfigSchema = new Schema({
    exam: { type: String, required: true },
    engineeringStream: { type: String, required: true },
    syllabus: { type: String, required: true },
    difficultyLevel: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    numberOfQuestions: { type: Number, required: true },
}, { _id: false });

/**
 * @const {Schema} QuestionSchema
 * @description A sub-schema for storing a single question from the quiz.
 */
const QuestionSchema = new Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { 
        type: Schema.Types.Mixed,
        required: true,
        set: function(v: string | string[]) {
            return Array.isArray(v) ? v.join(', ') : v;
        }
    },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    topic: { type: String }, // For metadata tagging
    prerequisites: [{ type: String }], // For knowledge graph
    timeTaken: { type: Number, default: 0 }, // Time in seconds per question
    errorType: { type: String, enum: ['Conceptual', 'Careless Slip', 'Question Misinterpretation', 'Correct'], default: 'Correct' },
}, { _id: false });

const PerformanceAnalysisSchema = new Schema({
    feedback: { type: String, required: true },
    weakestTopics: [{ type: String }],
    errorTypes: {
        conceptual: { type: Number, default: 0 },
        careless: { type: Number, default: 0 },
        misinterpretation: { type: Number, default: 0 },
    }
}, { _id: false });


/**
 * @const {Schema} QuizHistorySchema
 * @description The main Mongoose schema for the quiz history document.
 */
const QuizHistorySchema: Schema = new Schema({
  userEmail: { type: String, required: true, index: true },
  date: { type: Date, default: Date.now },
  config: { type: QuizConfigSchema, required: true },
  questions: { type: [QuestionSchema], required: true },
  // A plain Object is used for `userAnswers` for better serialization compatibility with Next.js Server Actions.
  userAnswers: { type: Object, of: String, required: true },
  score: { type: Number, required: true },
  totalTime: { type: Number, default: 0 }, // Total time for the quiz in seconds
  performanceAnalysis: { type: PerformanceAnalysisSchema },
});

// Export the model, creating it if it doesn't already exist.
export default models.QuizHistory || model<IQuizHistory>('QuizHistory', QuizHistorySchema);
