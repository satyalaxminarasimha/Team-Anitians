import { NextResponse } from 'next/server';
import { appRoute } from '@genkit-ai/next';

// Known flow handlers
import { analyzePerformanceFlow } from '@/ai/flows/analyze-performance-flow';
import { chatWithAIFlow } from '@/ai/flows/chat-flow';
import { explainAnswerFlow } from '@/ai/flows/explain-answer';
import { generateMCQQuestionsFlow } from '@/ai/flows/generate-mcq-questions';

const flowMap: Record<string, any> = {
	'analyze-performance-flow': analyzePerformanceFlow,
	'chat-flow': chatWithAIFlow,
	'explain-answer': explainAnswerFlow,
	'generate-mcq-questions': generateMCQQuestionsFlow,
};

export async function POST(req: Request, context: any) {
	// Next's generated types sometimes wrap params in a Promise; be defensive.
	const params = context?.params instanceof Promise ? await context.params : context?.params;
	const flowSegments = params?.flow || [];
	const flowName = flowSegments.join('/');

	// Attempt exact match, otherwise try last segment
	const handlerFlow = flowMap[flowName] || flowMap[flowSegments[flowSegments.length - 1]];

	if (!handlerFlow) {
		return NextResponse.json({ error: 'Unknown Genkit flow' }, { status: 404 });
	}

	// Use appRoute helper to wrap the Genkit flow
	return appRoute(handlerFlow)(req as any);
}
