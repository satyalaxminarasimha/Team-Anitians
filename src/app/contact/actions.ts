
"use server";

/**
 * @fileOverview This file contains the Server Action for handling the contact form submission.
 * It uses Zod for validation and Nodemailer to send the email.
 */

import { z } from "zod";
import nodemailer from "nodemailer";

/**
 * @const {z.ZodObject} contactSchema
 * @description The Zod schema for validating the contact form data.
 */
const contactSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

/**
 * Server Action to process and submit the contact form.
 * It validates the form data, creates a Nodemailer transporter, and sends an email
 * with the form content.
 *
 * @param {unknown} data - The raw form data from the client.
 * @returns {Promise<{success: boolean, message?: string, error?: string}>} An object indicating success or failure.
 */
export async function submitContactForm(data: unknown) {
  const parsed = contactSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: "Invalid form data." };
  }

  const { name, email, message } = parsed.data;

  // Create a transporter object using the Gmail SMTP service.
  // This requires GMAIL_USER and GMAIL_APP_PASSWORD to be set in the .env file.
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  // Define the email content.
  const mailOptions = {
    from: `"${name}" <${process.env.GMAIL_USER}>`, // sender address
    to: process.env.RECIPIENT_EMAIL, // list of receivers, set in .env
    subject: "New Contact Form Submission from Exam AI Prep", // Subject line
    text: message, // plain text body
    html: `
      <h2>New Message from Exam AI Prep Contact Form</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `, // html body
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: "Your message has been sent successfully!" };
  } catch (error) {
    console.error("Failed to send email", error);
    return { success: false, error: "Sorry, there was an error sending your message. Please try again later." };
  }
}
