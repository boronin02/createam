"use client";

import { AuthProvider } from "@/entities/auth/model/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
