import type { Message, ChatSession, SerializedChatSession } from '@/types/chat.types';

function isObjectId(value: any): boolean {
  return value && typeof value === 'object' && value.toString && value.buffer;
}

function isDate(value: any): boolean {
  return value instanceof Date;
}

export function serializeValue(value: any): any {
  if (!value) return value;
  
  // Handle ObjectId
  if (isObjectId(value)) {
    return value.toString();
  }
  
  // Handle Date
  if (isDate(value)) {
    return value.toISOString();
  }
  
  // Handle Arrays
  if (Array.isArray(value)) {
    return value.map(item => serializeValue(item));
  }
  
  // Handle Objects (but not Dates or ObjectIds)
  if (typeof value === 'object') {
    const serialized: { [key: string]: any } = {};
    for (const [key, val] of Object.entries(value)) {
      serialized[key] = serializeValue(val);
    }
    return serialized;
  }
  
  return value;
}

export function serializeDoc(doc: any): SerializedChatSession | null {
  if (!doc) return null;

  try {
    // Create a new object with all enumerable properties
    const serialized = serializeValue(doc);
    
    // Ensure _id is always a string
    if (serialized._id) {
      serialized._id = typeof serialized._id === 'string' 
        ? serialized._id 
        : serialized._id.toString();
    }

    return serialized;
  } catch (error) {
    console.error('Serialization error:', error);
    // Return a safe fallback object with minimal required fields
    return {
      _id: doc._id?.toString() || '',
      title: doc.title || 'Untitled Chat',
      messages: [],
      createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString()
    };
  }
}