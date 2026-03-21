import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "./config";
import { saveUserProfile } from "./users";

const googleProvider = new GoogleAuthProvider();

function ensureAuthInitialized() {
  if (auth) return auth;

  const error = new Error("Firebase Auth not initialized");
  (error as Error & { code: string }).code = "auth/not-configured";
  throw error;
}

export async function signUpWithEmail(email: string, password: string, firstName: string) {
  const firebaseAuth = ensureAuthInitialized();
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  if (firstName.trim()) {
    await updateProfile(credential.user, { displayName: firstName.trim() });
    // Also persist to Firestore so it's queryable and reflected in real-time
    await saveUserProfile(credential.user.uid, firstName.trim());
  }
  return credential;
}

export async function signInWithEmail(email: string, password: string) {
  const firebaseAuth = ensureAuthInitialized();
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

export async function signInWithGoogle() {
  const firebaseAuth = ensureAuthInitialized();
  return signInWithPopup(firebaseAuth, googleProvider);
}

export async function logOut() {
  const firebaseAuth = ensureAuthInitialized();
  return signOut(firebaseAuth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
