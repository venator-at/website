import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import type { ChatConversation, ChatConversationCreateInput, ChatMessage } from "@/types/chat";

function fromFirestore(id: string, data: Record<string, unknown>): ChatConversation {
  return {
    id,
    userId: data.userId as string,
    title: data.title as string,
    messages: (data.messages as ChatMessage[]) ?? [],
    createdAt:
      data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt:
      data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  };
}

export async function createChatConversation(
  input: ChatConversationCreateInput,
): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");
  const ref = await addDoc(collection(db, "chats"), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteChatConversation(chatId: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await deleteDoc(doc(db, "chats", chatId));
}

export async function updateChatConversation(
  chatId: string,
  messages: ChatMessage[],
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await updateDoc(doc(db, "chats", chatId), {
    messages,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToChats(
  userId: string,
  callback: (chats: ChatConversation[]) => void,
): Unsubscribe {
  if (!db) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, "chats"), where("userId", "==", userId));
  return onSnapshot(
    q,
    (snap) => {
      const chats = snap.docs
        .map((d) => fromFirestore(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      callback(chats);
    },
    (error) => {
      console.error("[Firestore] subscribeToChats failed", {
        code: error.code,
        message: error.message,
      });
      callback([]);
    },
  );
}
