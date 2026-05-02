"use client";
import { ApolloProvider } from "@apollo/client";
import type { ReactNode } from "react";
import { getApolloClient } from "@/lib/api/client";
import { AuthProvider } from "@/lib/auth/context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ApolloProvider client={getApolloClient()}>
      <AuthProvider>{children}</AuthProvider>
    </ApolloProvider>
  );
}
