"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type User } from "firebase/auth";
import { onAuthChange } from "@/lib/firebase/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

// ⚠️  DEV ONLY: Mock user for bypass mode — do NOT deploy to production
const DEV_BYPASS_ENABLED = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";
const DEV_MOCK_USER: Partial<User> = {
  uid: "dev-bypass-user-123",
  email: "dev@venator.local",
  displayName: "Development User",
  emailVerified: true,
} as User;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ⚠️  DEV ONLY: Bypass auth check if enabled
    if (DEV_BYPASS_ENABLED) {
      console.warn("🚨 DEV MODE: Login bypass is ENABLED. This must NOT be deployed to production.");
      setUser(DEV_MOCK_USER as User);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
