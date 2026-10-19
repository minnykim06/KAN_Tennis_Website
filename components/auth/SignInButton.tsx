"use client";

import type { ReactNode } from "react";
import { useAuthModal } from "./AuthModalProvider";

export function SignInButton({ children, className }: { children: ReactNode; className?: string }) {
  const { openAuth } = useAuthModal();
  return (
    <button type="button" onClick={openAuth} className={className}>
      {children}
    </button>
  );
}
