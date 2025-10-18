
/**
 * @fileOverview Initializes and configures the Genkit AI instance.
 * This file sets up the core `ai` object that is used throughout the application
 * to define and run AI flows, prompts, and tools. It configures the necessary
 * plugins, such as `googleAI`, to connect to the desired AI models.
 *
 * @exports ai - The configured Genkit instance.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

/**
 * @const {Genkit} ai
 * @description The global Genkit instance for the application.
 * It is initialized with the Google AI plugin, enabling access to Gemini models.
 */
export const ai = genkit({
  plugins: [googleAI()],
});
