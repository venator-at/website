import {
  doc,
  updateDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./config";

export interface UserProfile {
  credits: number;
  firstName: string;
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Upload a profile picture to Firebase Storage and return the download URL. */
export async function uploadUserAvatar(uid: string, file: File): Promise<string> {
  if (!storage) throw new Error("Firebase Storage is not initialized.");
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Ungültiger Dateityp. Nur JPEG, PNG und WebP sind erlaubt.");
  }
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new Error("Die Datei ist zu groß. Maximal 5 MB erlaubt.");
  }

  const ext = file.type.split("/")[1];
  const storageRef = ref(storage, `avatars/${uid}/${Date.now()}.${ext}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

/** Write firstName (and optionally photoURL, and credits if first time) to the Firestore users doc. */
export async function saveUserProfile(
  userId: string,
  firstName: string,
  photoURL?: string,
): Promise<void> {
  if (!db) return;
  const docRef = doc(db, "users", userId);
  const fields: Record<string, unknown> = {
    firstName: firstName.trim(),
    updatedAt: serverTimestamp(),
  };
  if (photoURL !== undefined) fields.photoURL = photoURL;
  try {
    await updateDoc(docRef, fields);
  } catch {
    // Doc might not exist yet (e.g. Google sign-in before first credit grant)
    await setDoc(docRef, {
      credits: 10,
      firstName: firstName.trim(),
      ...(photoURL !== undefined ? { photoURL } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
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
