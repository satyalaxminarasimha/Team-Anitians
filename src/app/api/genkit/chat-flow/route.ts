import { appRoute } from '@genkit-ai/next';
import { chatWithAIFlow } from '@/ai/flows/chat-flow';

export const POST = appRoute(chatWithAIFlow);
