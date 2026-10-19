"use client";

import { createContext, use, useCallback, useState, type ReactNode } from "react";
import { AuthModal } from "./AuthModal";

const AuthModalContext = createContext<{ openAuth: () => void } | null>(null);

/** Lets any component (navbar, home CTA, ...) open the sign-in modal. */
export function AuthModalProvider({ children }: { children: ReactNode }) {
  // Incrementing the key remounts the modal, so each opening starts fresh.
  const [openKey, setOpenKey] = useState(0);
  const [open, setOpen] = useState(false);

  const openAuth = useCallback(() => {
    setOpenKey((k) => k + 1);
    setOpen(true);
  }, []);

  return (
    <AuthModalContext value={{ openAuth }}>
      {children}
      {open && <AuthModal key={openKey} onClose={() => setOpen(false)} />}
    </AuthModalContext>
  );
}

export function useAuthModal() {
  const ctx = use(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used inside <AuthModalProvider>");
  return ctx;
}
