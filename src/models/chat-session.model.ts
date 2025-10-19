import mongoose from 'mongoose';
import type { Message } from '@/types/chat.types';

const chatSessionSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    title: { type: String, required: true },
    messages: [{
        role: { type: String, enum: ['user', 'model'], required: true },
        content: { type: String, required: true }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

chatSessionSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const ChatSession = mongoose.models.ChatSession || mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;