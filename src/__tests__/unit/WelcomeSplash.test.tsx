import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WelcomeSplash } from "@/components/layout/WelcomeSplash";

const STORAGE_KEY = "finlux_splash_shown";

describe("WelcomeSplash", () => {
  beforeEach(() => {
    sessionStorage.clear();
    document.documentElement.removeAttribute("data-splash");
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("renders the overlay in visible state on a fresh tab visit", () => {
    const { container } = render(<WelcomeSplash />);
    const overlay = container.querySelector(".finlux-splash-overlay");
    expect(overlay).not.toBeNull();
    expect(overlay?.getAttribute("data-state")).toBe("visible");
  });

  it("unmounts immediately when the sessionStorage flag is already set", async () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    const { container } = render(<WelcomeSplash />);
    // useEffect runs synchronously under act() with fake timers — flush it.
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.querySelector(".finlux-splash-overlay")).toBeNull();
  });

  it("marks the dismissed state and persists the flag once the animation ends", async () => {
    const { container } = render(<WelcomeSplash />);
    expect(container.querySelector(".finlux-splash-overlay")).not.toBeNull();

    await act(async () => {
      // Advance past fade start + fade duration (5500 + 700).
      vi.advanceTimersByTime(6500);
    });

    expect(container.querySelector(".finlux-splash-overlay")).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe("1");
    expect(document.documentElement.dataset.splash).toBe("dismissed");
  });
});
