/**
 * @fileOverview This file manages the connection to the MongoDB database.
 * It implements a caching mechanism to reuse an existing database connection
 * across multiple serverless function invocations, which is a critical
 * performance optimization in a serverless environment like Vercel.
 */
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env'
  );
}

/**
 * A global object is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially during API Route usage.
 * In production, this allows connection reuse between function invocations.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

/**
 * Establishes a connection to the MongoDB database.
 * If a connection is already cached, it returns the cached connection.
 * If a connection promise is pending, it awaits that promise.
 * Otherwise, it creates a new connection and caches it.
 *
 * @returns {Promise<mongoose.Connection>} A promise that resolves to the Mongoose connection object.
 */
async function dbConnect() {
  // If a connection is already established, return it.
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection is in the process of being established, wait for it to complete.
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('Attempting to connect to MongoDB...');
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('MongoDB connection successful.');
      return mongoose;
    }).catch(err => {
      console.error('MongoDB connection error:', err);
      cached.promise = null; // Reset promise on error to allow retries.
      throw err;
    });
  }
  
  try {
    // Await the connection promise and cache the connection object.
    cached.conn = await cached.promise;
  } catch (e) {
    // If the connection fails, reset the promise to allow for a new connection attempt.
    cached.promise = null;
    throw e;
  }
  
  return cached.conn;
}

export default dbConnect;
