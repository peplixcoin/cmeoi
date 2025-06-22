"use client";

import { useAuth } from "@/hooks/useAuth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  useAuth(); // This ensures redirection happens on the client side

  return <>{children}</>;
}
