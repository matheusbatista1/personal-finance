"use client";

import { useEffect, useState } from "react";
import { SplashScreen } from "@/components/layout/SplashScreen";

const STORAGE_KEY = "finlux_splash_shown";
const TOTAL_DURATION_MS = 5500;
const FADE_DURATION_MS = 700;

/**
 * Brand splash gate. Plays once per browser tab session (sessionStorage),
 * which means it fires on every fresh tab open and every sign-in (the auth
 * forms clear the flag before triggering navigation). Re-renders inside the
 * same tab — clicking sidebar links, refreshing the page — do not replay it.
 *
 * Both server and client render the splash visible from the start (so no
 * hydration mismatch). A tiny synchronous script in the root layout sets
 * `documentElement.dataset.splash = "dismissed"` BEFORE first paint when the
 * sessionStorage flag is already set, and a matching CSS rule hides the
 * overlay. The client effect below then unmounts the splash for returning
 * visitors or plays the animation for fresh ones.
 */
export function WelcomeSplash() {
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");

  useEffect(() => {
    let shown = false;
    try {
      shown = sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // Safari private mode and similar: treat as fresh visit.
    }

    if (shown) {
      setPhase("gone");
      return;
    }

    const fadeTimer = setTimeout(() => setPhase("fading"), TOTAL_DURATION_MS);
    const goneTimer = setTimeout(() => {
      setPhase("gone");
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore
      }
      document.documentElement.dataset.splash = "dismissed";
    }, TOTAL_DURATION_MS + FADE_DURATION_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(goneTimer);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden={phase !== "visible"}
      data-state={phase}
      className="finlux-splash-overlay fixed inset-0 z-[200]"
      style={{
        opacity: phase === "fading" ? 0 : 1,
        transition: `opacity ${FADE_DURATION_MS}ms ease-out`,
      }}
    >
      <SplashScreen />
    </div>
  );
}
