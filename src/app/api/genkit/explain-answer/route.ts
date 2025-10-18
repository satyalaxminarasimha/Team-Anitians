import { appRoute } from '@genkit-ai/next';
import { explainAnswerFlow } from '@/ai/flows/explain-answer';

export const POST = appRoute(explainAnswerFlow);
