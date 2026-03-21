import {
  doc,
  updateDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";

export interface UserProfile {
  credits: number;
  firstName: string;
}

/** Write firstName (and credits if first time) to the Firestore users doc. */
export async function saveUserProfile(
  userId: string,
  firstName: string,
): Promise<void> {
  if (!db) return;
  const ref = doc(db, "users", userId);
  try {
    await updateDoc(ref, { firstName: firstName.trim(), updatedAt: serverTimestamp() });
  } catch {
    // Doc might not exist yet (e.g. Google sign-in before first credit grant)
    await setDoc(ref, { credits: 10, firstName: firstName.trim(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
}

/** Subscribe to credits + firstName from the Firestore users doc. */
export function subscribeToUserProfile(
  userId: string,
  callback: (profile: UserProfile) => void,
): Unsubscribe {
  if (!db) {
    callback({ credits: 0, firstName: "" });
    return () => {};
  }

  const ref = doc(db, "users", userId);

  return onSnapshot(
    ref,
    async (snap) => {
      if (!snap.exists()) {
        await setDoc(ref, {
          credits: 10,
          firstName: "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        callback({ credits: 10, firstName: "" });
      } else {
        const data = snap.data();
        callback({
          credits: (data.credits as number) ?? 0,
          firstName: (data.firstName as string) ?? "",
        });
      }
    },
    (err) => {
      console.error("[users] subscribeToUserProfile error", err);
      callback({ credits: 0, firstName: "" });
    },
  );
}
