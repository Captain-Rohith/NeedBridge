"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import {
  firebaseAuth,
  registerUser,
  signInUser,
  signOutUser,
  subscribeToAuth
} from "@/lib/firebase-client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribeToAuth((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    async signIn(email, password) {
      await signInUser(email, password);
    },
    async signUp(name, email, password) {
      await registerUser(name, email, password);
    },
    async signOut() {
      await signOutUser();
    },
    async getIdToken() {
      return firebaseAuth.currentUser ? firebaseAuth.currentUser.getIdToken() : null;
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
