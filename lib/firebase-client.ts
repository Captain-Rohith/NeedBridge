"use client";

import { getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export const firebaseApp =
  getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);

export async function getBrowserMessaging() {
  if (!(await isSupported())) return null;
  return getMessaging(firebaseApp);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(firebaseAuth, callback);
}

export async function signInUser(email: string, password: string) {
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

export async function registerUser(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    email,
    password
  );
  if (name) {
    await updateProfile(credential.user, { displayName: name });
  }
  return credential;
}

export async function signOutUser() {
  return signOut(firebaseAuth);
}
