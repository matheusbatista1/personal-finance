import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Stub the server actions BEFORE importing the component.
const verifyMfa = vi.fn();
const signOut = vi.fn();

vi.mock("@/actions/auth", () => ({
  verifyMfa: (...args: unknown[]) => verifyMfa(...args),
  signOut: (...args: unknown[]) => signOut(...args),
}));

// Stop the abandoned-flow useEffect from actually navigating during tests.
const replaceSpy = vi.fn();
Object.defineProperty(window, "location", {
  value: { ...window.location, replace: replaceSpy },
  writable: true,
});

import { MfaChallenge } from "@/components/auth/MfaChallenge";

const FLAG_KEY = "finlux_mfa_flow";

describe("MfaChallenge", () => {
  beforeEach(() => {
    sessionStorage.clear();
    verifyMfa.mockReset();
    signOut.mockReset();
    replaceSpy.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the abandoned state and signs the user out when the tab flag is missing", async () => {
    signOut.mockResolvedValue(undefined);

    render(<MfaChallenge />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText(/Sessão expirada/i)).toBeTruthy();
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("shows the TOTP form when the tab flag is present", () => {
    sessionStorage.setItem(FLAG_KEY, "1");

    render(<MfaChallenge />);

    expect(screen.queryByText(/Sessão expirada/i)).toBeNull();
    expect(screen.getByLabelText(/Código de 6 dígitos/i)).toBeTruthy();
    // Submit button is disabled with no code entered.
    expect((screen.getByRole("button", { name: /Confirmar/i }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("clears the tab flag when the verification succeeds", async () => {
    sessionStorage.setItem(FLAG_KEY, "1");
    verifyMfa.mockResolvedValue({ ok: true });

    render(<MfaChallenge />);

    const input = screen.getByLabelText(/Código de 6 dígitos/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "123456" } });

    const button = screen.getByRole("button", { name: /Confirmar/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);

    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(verifyMfa).toHaveBeenCalledWith({ code: "123456" });
    expect(sessionStorage.getItem(FLAG_KEY)).toBeNull();
  });
});
