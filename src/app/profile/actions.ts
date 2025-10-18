
"use server";
/**
 * @fileOverview This file contains the Server Action for updating a user's profile.
 */

import dbConnect from "@/lib/db-connect";
import User from "@/models/user.model";
import { z } from "zod";

/**
 * @const {z.ZodObject} updateProfileSchema
 * @description Zod schema for validating the data when updating a user profile.
 */
const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  college: z.string().min(2, "College must be at least 2 characters."),
  email: z.string().email("Invalid email address."), // Used for lookup, not for update
  profilePicture: z.string().optional(), // Optional: base64 data URI
});

/**
 * Server Action to update a user's profile information.
 * It finds the user by email and updates their name, college, and profile picture.
 *
 * @param {unknown} data - The raw profile data from the client.
 * @returns {Promise<{success: boolean, message: string, user?: object}>} An object indicating success or failure.
 * On success, it returns the updated user profile object.
 */
export async function updateUserAction(data: unknown) {
  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    const errorMessage = parsed.error.errors.map((e) => e.message).join(", ");
    return { success: false, message: `Invalid input: ${errorMessage}` };
  }

  try {
    await dbConnect();

    const { email, name, college, profilePicture } = parsed.data;

    // Find user by email and update the specified fields.
    const user = await User.findOneAndUpdate(
      { email: email },
      { $set: { name, college, profilePicture } },
      { new: true, runValidators: true } // `new: true` returns the updated document
    );

    if (!user) {
      return { success: false, message: "User not found." };
    }
    
    // Return a clean user profile object.
    const userProfile = {
      name: user.name,
      college: user.college,
      email: user.email,
      profilePicture: user.profilePicture || null,
    };

    return { success: true, message: "Profile updated successfully.", user: userProfile };
  } catch (error) {
    console.error("Update Profile Error:", error);
    if (error instanceof Error) {
      return { success: false, message: `Server Error: ${error.message}` };
    }
    return { success: false, message: "An unexpected server error occurred." };
  }
}
