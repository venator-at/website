"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type User } from "firebase/auth";
import { onAuthChange } from "@/lib/firebase/auth";
import { subscribeToUserProfile } from "@/lib/firebase/users";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  credits: number;
  creditsLoading: boolean;
  firstName: string;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  credits: 0,
  creditsLoading: true,
  firstName: "",
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setCredits(0);
      setFirstName("");
      setCreditsLoading(false);
      return;
    }

    setCreditsLoading(true);
    const unsubscribe = subscribeToUserProfile(user.uid, (profile) => {
      setCredits(profile.credits);
      setFirstName(profile.firstName);
      setCreditsLoading(false);
    });

    return unsubscribe;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, credits, creditsLoading, firstName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
