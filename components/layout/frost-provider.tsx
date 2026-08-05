"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { FrostOverlay, type FrostMode } from "@/components/layout/frost-overlay";

type FrostContextValue = {
  show: (mode?: FrostMode, label?: string) => void;
  hide: () => void;
  mode: FrostMode | null;
};

const FrostContext = createContext<FrostContextValue | null>(null);

export function useFrost(): FrostContextValue {
  const ctx = useContext(FrostContext);
  if (!ctx) {
    return {
      show: () => {},
      hide: () => {},
      mode: null,
    };
  }
  return ctx;
}

/**
 * Global buzlu yükleme örtüsü. Route loading + senkron/güncelleme için.
 * hide() dalga animasyonuyla buzu dağıtır.
 */
export function FrostProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<FrostMode | null>(null);
  const [label, setLabel] = useState<string | undefined>();
  const [phase, setPhase] = useState<"idle" | "show" | "reveal">("idle");
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((next: FrostMode = "loading", nextLabel?: string) => {
    if (revealTimer.current) {
      clearTimeout(revealTimer.current);
      revealTimer.current = null;
    }
    setMode(next);
    setLabel(nextLabel);
    setPhase("show");
  }, []);

  const hide = useCallback(() => {
    setPhase((p) => (p === "show" ? "reveal" : p));
    if (revealTimer.current) clearTimeout(revealTimer.current);
    revealTimer.current = setTimeout(() => {
      setPhase("idle");
      setMode(null);
      setLabel(undefined);
      revealTimer.current = null;
    }, 780);
  }, []);

  useEffect(() => {
    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
  }, []);

  const value = useMemo(
    () => ({ show, hide, mode }),
    [show, hide, mode],
  );

  return (
    <FrostContext.Provider value={value}>
      {children}
      {phase !== "idle" && mode && (
        <FrostOverlay
          mode={mode}
          label={label}
          revealing={phase === "reveal"}
        />
      )}
    </FrostContext.Provider>
  );
}
