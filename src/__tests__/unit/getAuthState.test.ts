import { afterEach, describe, expect, it, vi } from "vitest";

type FactorStatus = "verified" | "unverified";
type AALLevel = "aal1" | "aal2" | null;

interface MockSupabase {
  auth: {
    getUser: ReturnType<typeof vi.fn>;
    mfa: {
      getAuthenticatorAssuranceLevel: ReturnType<typeof vi.fn>;
      listFactors: ReturnType<typeof vi.fn>;
    };
  };
}

let mockSupabase: MockSupabase;

vi.mock("@/infrastructure/database/supabase/server", () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

function buildSupabaseMock(opts: {
  user: { id: string } | null;
  currentAAL?: AALLevel;
  factors?: Array<{ status: FactorStatus }>;
  listFactorsError?: { message: string } | null;
}): MockSupabase {
  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: opts.user }, error: null })),
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn(async () => ({
          data: {
            currentLevel: opts.currentAAL ?? null,
            nextLevel: null,
            currentAuthenticationMethods: [],
          },
          error: null,
        })),
        listFactors: vi.fn(async () => ({
          data: opts.listFactorsError
            ? null
            : { totp: opts.factors ?? [], all: opts.factors ?? [] },
          error: opts.listFactorsError ?? null,
        })),
      },
    },
  };
}

async function callGetAuthState() {
  // Re-import after mock setup so the fresh module sees our mock.
  const { getAuthState } = await import("@/lib/auth");
  return getAuthState();
}

describe("getAuthState", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("returns no user and no MFA pending when there is no session", async () => {
    mockSupabase = buildSupabaseMock({ user: null });
    const result = await callGetAuthState();
    expect(result).toEqual({ user: null, mfaPending: false });
  });

  it("short-circuits when the session is already at AAL2", async () => {
    mockSupabase = buildSupabaseMock({ user: { id: "u1" }, currentAAL: "aal2" });
    const result = await callGetAuthState();
    expect(result.user).toEqual({ id: "u1" });
    expect(result.mfaPending).toBe(false);
    expect(mockSupabase.auth.mfa.listFactors).not.toHaveBeenCalled();
  });

  it("flags MFA pending when at AAL1 with a verified TOTP factor", async () => {
    mockSupabase = buildSupabaseMock({
      user: { id: "u2" },
      currentAAL: "aal1",
      factors: [{ status: "verified" }],
    });
    const result = await callGetAuthState();
    expect(result.user).toEqual({ id: "u2" });
    expect(result.mfaPending).toBe(true);
  });

  it("does NOT flag MFA pending at AAL1 when no factor is verified", async () => {
    mockSupabase = buildSupabaseMock({
      user: { id: "u3" },
      currentAAL: "aal1",
      factors: [{ status: "unverified" }],
    });
    const result = await callGetAuthState();
    expect(result.user).toEqual({ id: "u3" });
    expect(result.mfaPending).toBe(false);
  });

  it("gracefully reports no MFA pending if listFactors errors out", async () => {
    mockSupabase = buildSupabaseMock({
      user: { id: "u4" },
      currentAAL: "aal1",
      listFactorsError: { message: "boom" },
    });
    const result = await callGetAuthState();
    expect(result.user).toEqual({ id: "u4" });
    expect(result.mfaPending).toBe(false);
  });
});
