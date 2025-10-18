
/**
 * @fileOverview This file defines the Mongoose schema and model for storing user statistics
 * related to gamification, such as points, badges, and streaks.
 */

import mongoose, { Document, Schema, models, model } from 'mongoose';

/**
 * @interface IUserStats
 * @description Defines the structure for a user stats document in MongoDB.
 */
export interface IUserStats extends Document {
  userEmail: string;
  points: number;
  badges: string[]; // e.g., ["5-Day Streak", "Topic Master: Algorithms"]
  currentStreak: number;
  longestStreak: number;
  lastQuizDate: Date | null;
}

/**
 * @const {Schema} UserStatsSchema
 * @description The main Mongoose schema for the user stats document.
 */
const UserStatsSchema: Schema = new Schema({
  userEmail: { type: String, required: true, unique: true, index: true },
  points: { type: Number, default: 0 },
  badges: [{ type: String }],
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastQuizDate: { type: Date, default: null },
});

// Export the model, creating it if it doesn't already exist.
export default models.UserStats || model<IUserStats>('UserStats', UserStatsSchema);
