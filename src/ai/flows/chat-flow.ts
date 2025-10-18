
'use server';
/**
 * @fileOverview A conversational AI flow for general chat.
 * This file defines the Genkit flow responsible for handling the chat functionality
 * of the 'PrepBot' assistant. It takes the conversation history and a system
 * prompt to generate a context-aware and persona-driven response.
 *
 * @exports chatWithAI - An asynchronous function to interact with the chat flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Message } from '@/app/chat/page';
import { googleAI } from '@genkit-ai/googleai';

/**
 * @typedef {object} ChatWithAIInput
 * @property {Array<object>} messages - The history of the conversation.
 * @property {'user' | 'model'} messages.role - The role of the message sender.
 * @property {string} messages.content - The content of the message.
 */
const ChatWithAIRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).describe("The history of the conversation."),
});

/**
d * @typedef {object} ChatWithAIOutput
 * @property {string} response - The AI's response to the user's message.
 */
const ChatWithAIResponseSchema = z.object({
  response: z.string().describe("The AI's response to the user's message."),
});

/**
 * Public-facing wrapper function that invokes the chat Genkit flow.
 *
 * @param {{ messages: Message[] }} input - The conversation history.
 * @returns {Promise<{ response: string }>} A promise that resolves to the AI's response.
 */
export async function chatWithAI(input: { messages: Message[] }): Promise<{ response: string }> {
  const out: any = await chatWithAIFlow(input);
  return { response: out?.response ?? out?.text ?? 'No response from AI.' };
}

/**
 * @const {Flow} chatWithAIFlow
 * @description The main Genkit flow for handling chat conversations.
 * It processes the message history, constructs a prompt for the Gemini model,
 * and returns the generated response.
 *
 * @param {z.infer<typeof ChatWithAIRequestSchema>} input - The validated input object containing the messages.
 * @returns {Promise<z.infer<typeof ChatWithAIResponseSchema>>} A promise that resolves to the AI's response.
 */
export const chatWithAIFlow = ai.defineFlow(
  {
    name: 'chatWithAIFlow',
    inputSchema: ChatWithAIRequestSchema,
    outputSchema: ChatWithAIResponseSchema,
  },
  async (input) => {
    const { messages } = input;
    
    // We need to map our application's message format to the one Genkit expects for history.
    const genkitMessages = messages.map(msg => ({
        role: msg.role,
        content: [{ text: msg.content }]
    }));
    
    // The last message is treated as the current user prompt, and the rest is history.
    const lastMessage = genkitMessages.pop();
    if (!lastMessage) {
        return { response: "I'm sorry, I didn't receive a message." };
    }

    // Call the Gemini model with the prompt, history, and a system prompt.
    const responseAny: any = await (ai as any).generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: lastMessage.content[0].text,
      history: genkitMessages,
      config: {
        // Lower temperature for more factual, less creative responses, suitable for a tutor.
        temperature: 0.3,
      },
      // System prompt to define the AI's persona and capabilities.
      system: `You are 'PrepBot', a powerful and friendly AI assistant, powered by Google's Gemini models. Your purpose is to help students preparing for competitive exams.

               Your capabilities include:
               - Explaining complex academic topics clearly and concisely.
               - Providing detailed, step-by-step solutions to problems.
               - Offering effective study strategies and tips.
               - Answering general questions about exams, syllabi, and career paths.
               - Acting as a supportive and encouraging study partner.

               **IMPORTANT**: You have been provided with a specific set of exam and syllabus data. When asked about a syllabus, you MUST use this information as your primary source of truth. Do not rely on your general knowledge if the information is present here.

               Here is the syllabus information you must use:

               - **Graduate Aptitude Test In Engineering (GATE)**:
                 - **Computer Science and Information Technology**: Engineering Mathematics, Digital Logic, Computer Organization and Architecture, Programming and Data Structures, Algorithms, Theory of Computation, Compiler Design, Operating System, Databases, Computer Networks.
                 - **Mechanical Engineering**: Engineering Mathematics, Applied Mechanics and Design (Engineering Mechanics, Mechanics of Materials, Theory of Machines, Vibrations, Machine Design), Fluid Mechanics and Thermal Sciences (Fluid Mechanics, Heat-Transfer, Thermodynamics, Applications), Materials, Manufacturing and Industrial Engineering (Engineering Materials, Casting, Forming and Joining Processes, Machining and Machine Tool Operations, Metrology and Inspection, Computer Integrated Manufacturing, Production Planning and Control, Inventory Control, Operations Research).
                 - **Electrical Engineering**: Engineering Mathematics, Electric circuits, Electromagnetic Fields, Signals and Systems, Electrical Machines, Power Systems, Control Systems, Electrical and Electronic Measurements, Analog and Digital Electronics, Power Electronics.
                 - **Civil Engineering**: Engineering Mathematics, Structural Engineering (Engineering Mechanics, Solid Mechanics, Structural Analysis, Construction Materials and Management, Concrete Structures, Steel Structures), Geotechnical Engineering (Soil Mechanics, Foundation Engineering), Water Resources Engineering (Fluid Mechanics, Hydrology, Irrigation), Environmental Engineering (Water and Waste Water, Air Pollution, Municipal Solid Wastes, Noise Pollution), Transportation Engineering (Transportation Infrastructure, Highway Pavements, Traffic Engineering), Geomatics Engineering (Principles of surveying, Maps, Surveying measurements).
                 - **Electronics and Communication Engineering**: Engineering Mathematics, Networks, Signals and Systems, Electronic Devices, Analog Circuits, Digital Circuits, Control Systems, Communications, Electromagnetics.
                 - **Data Science and Artificial intelligence (DA)**: Probability and Statistics, Linear Algebra, Calculus and Optimization, Programming, Data Structures and Algorithms, Database Management and Warehousing, Machine Learning, Artificial Intelligence.

               - **JEE Main**:
                 - **Subjects**: Physics, Chemistry, Mathematics.

               - **Common Admission Test (CAT)**:
                 - **Subjects**: Verbal Ability & Reading Comprehension, Data Interpretation & Logical Reasoning, Quantitative Aptitude.
               
               - **National Eligibility Cum Entrance Test (NEET)**:
                 - **Subjects**: Physics, Chemistry, Biology.

               Always strive to provide comprehensive, accurate, and helpful information. Be conversational and engaging.`
    });

    return {
      response: responseAny?.text ?? responseAny?.output ?? String(responseAny),
    };
  }
);
