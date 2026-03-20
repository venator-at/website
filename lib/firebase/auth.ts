import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./config";

const googleProvider = new GoogleAuthProvider();

function ensureAuthInitialized() {
  if (auth) return auth;

  const error = new Error("Firebase Auth not initialized");
  (error as Error & { code: string }).code = "auth/not-configured";
  throw error;
}

export async function signUpWithEmail(email: string, password: string) {
  const firebaseAuth = ensureAuthInitialized();
  return createUserWithEmailAndPassword(firebaseAuth, email, password);
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
