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