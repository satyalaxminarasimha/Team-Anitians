export interface Message {
  role: "user" | "model";
  content: string;
}

export interface ChatSession {
  _id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  userEmail?: string;
  __v?: number;
}

export interface SerializedChatSession extends ChatSession {}