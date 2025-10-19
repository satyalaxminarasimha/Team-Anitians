export interface Question {
  question: string;
  type: 'MCQ' | 'MSQ' | 'NTQ';
  options?: string[];
  correctAnswer: string | string[] | number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeTaken?: number;
  topic?: string;
  numericRange?: {
    min?: number;
    max?: number;
  };
  errorType?: string;
}

export interface QuizConfig {
  exam: string;
  engineeringStream: string;
  syllabus: string;
  difficultyLevel: 'Easy' | 'Medium' | 'Hard';
  numberOfQuestions: number;
}

export interface QuizHistoryItem {
  id: string;
  date: Date | string;
  config: QuizConfig;
  questions: Question[];
  userAnswers: (string | string[] | number | undefined)[];
  score: number;
  totalTime: number;
  performanceAnalysis?: {
    feedback: string;
    weakestTopics: string[];
    errorTypes: {
      conceptual: number;
      careless: number;
      misinterpretation: number;
    };
  };
}