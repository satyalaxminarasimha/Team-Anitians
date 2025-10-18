
"use server";

/**
 * @fileOverview This file contains Server Actions related to user authentication.
 * It handles user registration (sending and verifying OTP) and login.
 * It uses Zod for input validation and Nodemailer for sending emails.
 */

import dbConnect from "@/lib/db-connect";
import User from "@/models/user.model";
import { z } from "zod";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

// Schemas for validation
const sendOtpSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    college: z.string().min(2, "College name must be at least 2 characters."),
    email: z.string().email("Invalid email address."),
});

const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address."),
  otp: z.string().length(6, "OTP must be 6 digits."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

/**
 * Configures and sends an OTP email to the user.
 * @param {string} email - The recipient's email address.
 * @param {string} otp - The 6-digit One-Time Password to send.
 * @returns {Promise<void>}
 */
async function sendOTPEmail(email: string, otp: string) {
    // This transporter uses Gmail's SMTP server.
    // GMAIL_USER and GMAIL_APP_PASSWORD must be set in the .env file.
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    const mailOptions = {
        from: `"Exam AI Prep" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Your OTP for Exam AI Prep Registration",
        text: `Your One-Time Password is: ${otp}. It is valid for 10 minutes.`,
        html: `
            <h2>Exam AI Prep Registration</h2>
            <p>Thank you for registering. Please use the following One-Time Password to complete your registration:</p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
            <p>This OTP is valid for 10 minutes.</p>
        `,
    };

    await transporter.sendMail(mailOptions);
}

/**
 * Server Action to handle the first step of user registration.
 * It validates user details, generates an OTP, hashes it, and saves it to the database
 * with a 10-minute expiry. It then sends the OTP to the user's email.
 *
 * @param {unknown} data - The user's registration details (name, college, email).
 * @returns {Promise<{success: boolean, message: string}>} An object indicating success or failure.
 */
export async function registerUserAction(data: unknown) {
    const parsed = sendOtpSchema.safeParse(data);
    if (!parsed.success) {
        const errorMessage = parsed.error.errors.map(e => e.message).join(", ");
        return { success: false, message: `Invalid input: ${errorMessage}` };
    }
    
    try {
        await dbConnect();
        
        const { name, college, email } = parsed.data;

    const existingUser = await (User as any).findOne({ email });
        if (existingUser && existingUser.status === 'active') {
            return { success: false, message: "An account with this email already exists." };
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        if (existingUser) {
             // If user exists but is 'pending', update their details and OTP.
            existingUser.name = name;
            existingUser.college = college;
            existingUser.otp = otpHash;
            existingUser.otpExpires = otpExpiry;
            await existingUser.save();
        } else {
            // Create a new user with a 'pending' status.
            const newUser = new User({
                name,
                college,
                email,
                otp: otpHash,
                otpExpires: otpExpiry,
                status: 'pending'
            });
            await newUser.save();
        }

        await sendOTPEmail(email, otp);

        return { success: true, message: "OTP has been sent to your email." };

    } catch (error) {
        console.error("Registration Error:", error);
        return { success: false, message: "An unexpected server error occurred." };
    }
}

/**
 * Server Action to handle the second step of registration (OTP verification).
 * It validates the OTP against the hashed version in the database, checks for expiry,
 * and if valid, hashes the user's chosen password and activates the account.
 *
 * @param {unknown} data - The user's email, OTP, and desired password.
 * @returns {Promise<{success: boolean, message: string}>} An object indicating success or failure.
 */
export async function verifyOtpAction(data: unknown) {
    const parsed = verifyOtpSchema.safeParse(data);
    if (!parsed.success) {
        const errorMessage = parsed.error.errors.map(e => e.message).join(", ");
        return { success: false, message: `Invalid input: ${errorMessage}` };
    }

    try {
        await dbConnect();
        const { email, otp, password } = parsed.data;

        // Find the user with 'pending' status and select the OTP fields for comparison.
    const user = await (User as any).findOne({ email, status: 'pending' }).select('+otp +otpExpires');

        if (!user) {
            return { success: false, message: "No pending registration found for this email." };
        }

        if (user.otpExpires && user.otpExpires < new Date()) {
            return { success: false, message: "OTP has expired. Please try registering again." };
        }

        const isOtpValid = await bcrypt.compare(otp, user.otp || "");
        if (!isOtpValid) {
            return { success: false, message: "Invalid OTP." };
        }
        
        // OTP is valid. Hash the password.
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Update user to 'active' status and remove OTP fields.
        user.password = hashedPassword;
        user.status = 'active';
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();
        
        return { success: true, message: "Registration successful. You can now log in." };

    } catch (error) {
        console.error("OTP Verification Error:", error);
        return { success: false, message: "An unexpected server error occurred." };
    }
}

/**
 * Server Action to handle user login.
 * It validates credentials, finds the active user, and compares the provided password
 * with the hashed password in the database.
 *
 * @param {unknown} data - The user's email and password.
 * @returns {Promise<{success: boolean, user?: object, message?: string}>} On success, returns user profile. On failure, returns an error message.
 */
export async function loginUserAction(data: unknown) {
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, message: "Invalid input." };
    }
    
    try {
        await dbConnect();
        // Find an active user and select the password field for comparison.
    const user = await (User as any).findOne({ email: parsed.data.email, status: 'active' }).select('+password');

        if (!user || !user.password) {
             return { success: false, message: "Invalid email or password, or account not verified." };
        }

        const isPasswordMatch = await bcrypt.compare(parsed.data.password, user.password);

        if (!isPasswordMatch) {
             return { success: false, message: "Invalid email or password." };
        }
        
        // Return a clean user profile object, excluding sensitive data.
        const userProfile = {
            name: user.name,
            college: user.college,
            email: user.email,
            profilePicture: user.profilePicture || null,
        };
        
        return { success: true, user: userProfile };

    } catch (error) {
        console.error("Login Error:", error);
        if (error instanceof Error) {
          return { success: false, message: `Server Error: ${error.message}` };
        }
        return { success: false, message: "An unexpected error occurred during login." };
    }
}
