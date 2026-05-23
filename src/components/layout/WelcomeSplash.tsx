"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { dismissSplash } from "@/actions/splash";
import { SplashScreen } from "@/components/layout/SplashScreen";

const TOTAL_DURATION_MS = 3400;
const FADE_DURATION_MS = 500;

/**
 * Mounts a full-screen splash for ~3.4s, then fades out and unmounts.
 * Dismisses the splash cookie immediately so a refresh won't replay it.
 */
export function WelcomeSplash() {
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");

  useEffect(() => {
    void dismissSplash();
    const fadeTimer = setTimeout(() => setPhase("fading"), TOTAL_DURATION_MS);
    const goneTimer = setTimeout(() => setPhase("gone"), TOTAL_DURATION_MS + FADE_DURATION_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(goneTimer);
    };
  }, []);

  if (phase === "gone" || typeof document === "undefined") return null;

  return createPortal(
    <div
      style={{
        opacity: phase === "fading" ? 0 : 1,
        transition: `opacity ${FADE_DURATION_MS}ms ease-out`,
      }}
      className="fixed inset-0 z-[200]"
    >
      <SplashScreen />
    </div>,
    document.body,
  );
}
