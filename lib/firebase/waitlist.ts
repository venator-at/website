import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "./config";

export async function addToWaitlist(email: string): Promise<{ success: boolean; alreadyExists: boolean }> {
  if (!db) throw new Error("Firestore not initialized");

  const q = query(collection(db, "waitlist"), where("email", "==", email.toLowerCase().trim()));
  const existing = await getDocs(q);

  if (!existing.empty) {
    return { success: true, alreadyExists: true };
  }

  await addDoc(collection(db, "waitlist"), {
    email: email.toLowerCase().trim(),
    createdAt: serverTimestamp(),
  });

  return { success: true, alreadyExists: false };
}
