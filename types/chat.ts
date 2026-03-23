export interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

export interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export type ChatConversationCreateInput = Omit<ChatConversation, "id" | "createdAt" | "updatedAt">;
