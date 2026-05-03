"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { readToken, writeToken, clearToken } from "./storage";

export type AuthUser = {
  id: string;
  email: string;
  nickname: string;
  rate: number;
  wins: number;
  losses: number;
  draws: number;
  bestScore: number | null;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  setSession(args: { token: string; user: AuthUser }): void;
  logout(): void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, token: null, loading: true });
  const router = useRouter();

  useEffect(() => {
    const token = readToken();
    if (!token) {
      setState({ user: null, token: null, loading: false });
      return;
    }
    fetch(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        query: "query Me { me { id email nickname rate wins losses draws bestScore } }",
      }),
    })
      .then((r) => r.json())
      .then((j) => {
        const u = j?.data?.me as AuthUser | null;
        if (u) setState({ user: u, token, loading: false });
        else {
          clearToken();
          setState({ user: null, token: null, loading: false });
        }
      })
      .catch(() => {
        clearToken();
        setState({ user: null, token: null, loading: false });
      });
  }, []);

  const setSession = useCallback((args: { token: string; user: AuthUser }) => {
    writeToken(args.token);
    setState({ user: args.user, token: args.token, loading: false });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setState({ user: null, token: null, loading: false });
    router.push("/login");
  }, [router]);

  const value = useMemo<AuthContextValue>(() => ({ ...state, setSession, logout }), [state, setSession, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
