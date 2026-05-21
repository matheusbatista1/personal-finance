import { afterEach, describe, expect, it } from "vitest";
import { adminClient, createTestUser, deleteTestUser, type TestUser } from "./_helpers";

describe("handle_new_user trigger", () => {
  const createdUsers: TestUser[] = [];

  afterEach(async () => {
    while (createdUsers.length > 0) {
      const u = createdUsers.pop();
      if (u) await deleteTestUser(u.id);
    }
  });

  it("creates a profile row on signup", async () => {
    const user = await createTestUser();
    createdUsers.push(user);

    const { data, error } = await adminClient
      .from("profiles")
      .select("id, display_name")
      .eq("id", user.id)
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBe(user.id);
    expect(data?.display_name).toBeTruthy();
  });

  it("creates a default 'Outros' wallet on signup", async () => {
    const user = await createTestUser();
    createdUsers.push(user);

    const { data: wallets, error } = await adminClient
      .from("wallets")
      .select("id, name, is_default, account_type, balance_cents")
      .eq("user_id", user.id);

    expect(error).toBeNull();
    expect(wallets).toHaveLength(1);
    expect(wallets?.[0]).toMatchObject({
      name: "Outros",
      is_default: true,
      account_type: "PF",
      balance_cents: 0,
    });
  });

  it("derives display_name from email when not provided", async () => {
    const user = await createTestUser();
    createdUsers.push(user);

    const { data } = await adminClient
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const expectedFromEmail = user.email.split("@")[0];
    expect(data?.display_name).toBe(expectedFromEmail);
  });
});
