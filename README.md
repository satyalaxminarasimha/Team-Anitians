# Exam AI Prep: AI-Powered Exam Practice

This is a Next.js application designed to help students prepare for a variety of competitive exams. It uses AI to generate tailored multiple-choice questions (MCQs) and provide instant, detailed explanations for answers.

## Features

- **User Authentication:** Secure registration and login system for personalized experiences.
- **Multi-Exam Support:** Covers a wide range of exams including GATE, JEE, CAT, UPSC, and more.
- **AI-Powered Quiz Generation:** Create custom practice quizzes based on exam, stream, syllabus topics, and difficulty level.
- **Instant Explanations:** Get immediate, AI-generated explanations for every question to understand concepts better.
- **Database-Powered Quiz History:** Track your progress by reviewing past quizzes and scores, saved to your account.
- **Previous Year Papers:** Access a repository of past question papers.
- **Editable User Profiles:** Users can view and update their profile information.
- **Responsive Design:** Fully functional on desktops, tablets, and mobile devices.

## Tech Stack

- **Framework:** Next.js (App Router)
- **AI Integration:** Google's Gemini Pro via Genkit
- **UI:** React, TypeScript, ShadCN UI, Tailwind CSS
- **Database:** MongoDB (with Mongoose)
- **Authentication:** Custom, simplified auth using server actions

---

## Local Setup and Installation

Follow these steps to set up and run the project on your local machine.

### 1. Prerequisites

Make sure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### 2. Install Dependencies

Open your terminal, navigate to the project's root directory, and run the following command to install all the required packages from `package.json`:

```bash
npm install
```

### 3. Set Up Environment Variables

The application requires a connection to a MongoDB database.

a. Create a new file named `.env` in the root directory of the project.

b. Add your MongoDB connection string to this file, like so:

```
MONGODB_URI="your_mongodb_connection_string_here"
```

**Important:** Replace `"your_mongodb_connection_string_here"` with your actual MongoDB Atlas connection string. Make sure to include your database password and encode any special characters if necessary.

### 4. Running the Application Locally

This project has two main parts that need to run at the same time: the **Next.js web application** and the **Genkit AI service**. You'll need to open two separate terminal windows for this.

**Terminal 1: Start the Next.js App**

In your first terminal, run this command to start the web application's development server:

```bash
npm run dev
```
This will typically start the app on `http://localhost:9002`.

**Terminal 2: Start the Genkit AI Service**

In your second terminal, run this command to start the Genkit development server, which handles the AI-powered features:

```bash
npm run genkit:dev
```
This will start the Genkit development UI, which you can usually access at `http://localhost:4000` to monitor your AI flows.

---

Once both services are running, you can open your browser and navigate to `http://localhost:9002` to use the Exam AI Prep application.
