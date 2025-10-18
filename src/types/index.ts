import { z } from 'zod';

export const quizConfigSchema = z.object({
  exam: z.string().min(1, "Please select an exam."),
  engineeringStream: z.string().min(1, "Please select a stream or subject."),
  syllabus: z.string().min(10, "Syllabus must be at least 10 characters.").max(10000),
  difficultyLevel: z.enum(["Easy", "Medium", "Hard"]),
  numberOfQuestions: z.coerce.number().min(1).max(100),
});

export type QuizConfig = z.infer<typeof quizConfigSchema>;

export interface Question {
  question: string;
  type: 'MCQ' | 'MSQ' | 'NTQ';
  options?: string[];
  correctAnswer: string | string[] | number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeTaken?: number;
  topic?: string;
  numericRange?: {
    min: number;
    max: number;
  };
}

export type UserAnswers = Record<number, string | string[] | number>;