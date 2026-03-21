import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";

export const FREE_CREDITS = 10;
export const CREDITS_PER_GENERATION = 10;

/** Subscribe to real-time credits for a user. Creates the doc with FREE_CREDITS if missing. */
export function subscribeToCredits(
  userId: string,
  callback: (credits: number) => void,
): Unsubscribe {
  if (!db) {
    callback(0);
    return () => {};
  }

  const ref = doc(db, "users", userId);

  return onSnapshot(
    ref,
    async (snap) => {
      if (!snap.exists()) {
        // First login — grant free credits
        await setDoc(ref, {
          credits: FREE_CREDITS,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        callback(FREE_CREDITS);
      } else {
        callback((snap.data().credits as number) ?? 0);
      }
    },
    (err) => {
      console.error("[credits] subscribeToCredits error", err);
      callback(0);
    },
  );
}
