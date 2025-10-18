import { appRoute } from '@genkit-ai/next';
import { generateMCQQuestionsFlow } from '@/ai/flows/generate-mcq-questions';

export const POST = appRoute(generateMCQQuestionsFlow);
