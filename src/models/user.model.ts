
/**
 * @fileOverview This file defines the Mongoose schema and model for the User.
 * It includes all user-related fields, such as personal details, authentication
 * status, and OTP information for registration.
 */

import mongoose, { Document, Schema, models } from 'mongoose';

/**
 * @interface IUser
 * @description Defines the structure for a user document in MongoDB.
 */
export interface IUser extends Document {
  name: string;
  college: string;
  email: string;
  password?: string; // Optional because it's set after OTP verification. `select: false` by default.
  status: 'pending' | 'active'; // Tracks registration progress.
  otp?: string; // `select: false` by default.
  otpExpires?: Date; // `select: false` by default.
  profilePicture?: string; // Base64 data URI for the profile picture.
  inferredLearningStyle?: 'visual' | 'code-first' | 'needs-confidence' | 'default'; // For dynamic profiling
}

/**
 * @const {Schema} UserSchema
 * @description The Mongoose schema for the User model.
 */
const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  college: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, select: false }, // `select: false` prevents password from being returned in queries by default.
  status: { type: String, enum: ['pending', 'active'], default: 'pending' },
  otp: { type: String, select: false },
  otpExpires: { type: Date, select: false },
  profilePicture: { type: String }, // Stores base64 data URI
  inferredLearningStyle: { type: String, enum: ['visual', 'code-first', 'needs-confidence', 'default'], default: 'default' },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields.
  toObject: { getters: true },
  toJSON: { getters: true },
});

// Export the model, creating it if it doesn't already exist.
export default models.User || mongoose.model<IUser>('User', UserSchema);
