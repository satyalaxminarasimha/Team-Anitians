'use server';

import { revalidatePath } from 'next/cache';
import { chatWithAI } from '@/ai/flows/chat-flow';
import ChatSession from '@/models/chat-session.model';
import dbConnect from '@/lib/db-connect';
import type { Message } from '@/types/chat.types';
import { serializeDoc } from '@/lib/utils/serialization';

export async function createNewChatSession(userEmail: string) {
    await dbConnect();
    const title = generateDefaultTitle();
    const session = new ChatSession({
        userEmail,
        title,
        messages: []
    });
    const savedSession = await session.save();
    return { success: true, data: serializeDoc(savedSession) };
}

export async function getChatSessions(userEmail: string) {
    await dbConnect();
    // ChatSession is a Mongoose model; use `as any` to avoid union-call typing issues
    const sessions = await (ChatSession as any).find({ userEmail })
        .sort({ updatedAt: -1 })
        .select('title messages createdAt updatedAt')
        .lean();
    return { success: true, data: sessions.map(serializeDoc) };
}

export async function getChatSession(sessionId: string) {
    await dbConnect();
    const session = await (ChatSession as any).findById(sessionId).lean();
    if (!session) {
        return { success: false, error: 'Chat session not found' };
    }
    return { success: true, data: serializeDoc(session) };
}

export async function updateChatSession(sessionId: string, messages: Message[]) {
    await dbConnect();
    const session = await (ChatSession as any).findByIdAndUpdate(
        sessionId,
        { messages, updatedAt: new Date() },
        { new: true }
    ).lean();
    
    if (!session) {
        return { success: false, error: 'Chat session not found' };
    }
    
    return { success: true, data: serializeDoc(session) };
}

export async function updateSessionTitle(sessionId: string, title: string) {
    await dbConnect();
    const session = await (ChatSession as any).findByIdAndUpdate(
        sessionId,
        { title },
        { new: true }
    ).lean();
    
    if (!session) {
        return { success: false, error: 'Chat session not found' };
    }
    
    return { success: true, data: serializeDoc(session) };
}

export async function deleteChatSession(sessionId: string) {
    await dbConnect();
    await (ChatSession as any).findByIdAndDelete(sessionId);
    revalidatePath('/chat');
    return { success: true };
}

export async function sendChatMessage(sessionId: string, messages: Message[]) {
    try {
        const result: any = await chatWithAI({ messages });
        if (result && result.response) {
            const newMessage: Message = { role: "model" as const, content: result.response };
            const updatedMessages = [...messages, newMessage];
            
            const session = await updateChatSession(sessionId, updatedMessages);
            if (!session.success) {
                throw new Error(session.error || 'Failed to update chat session');
            }

            return { 
                success: true, 
                data: { 
                    response: result.response,
                    session: session.data 
                } 
            };
        }
        return { success: false, error: 'Failed to get AI response' };
    } catch (e) {
        console.error('Chat error:', e);
        return { success: false, error: 'Failed to process message' };
    }
}

function generateDefaultTitle() {
    const now = new Date();
    return `Chat ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
}