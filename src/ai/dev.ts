
import { config } from 'dotenv';
config();

// This file is the entrypoint for the Genkit developer UI.
// It is not used in production.
import './flows/generate-mcq-questions';
import './flows/explain-answer';
import './flows/chat-flow';
import './tools/paper-analysis-tools';
import './flows/analyze-papers-flow';
import './flows/analyze-performance-flow';
