import { appRoute } from '@genkit-ai/next';
import { analyzePerformanceFlow } from '@/ai/flows/analyze-performance-flow';

export const POST = appRoute(analyzePerformanceFlow);
