import { afterEach, describe, expect, it } from "vitest";
import { createTestUser, deleteTestUser, type TestUser } from "./_helpers";

describe("Row Level Security — cross-user isolation", () => {
  const createdUsers: TestUser[] = [];

  afterEach(async () => {
    while (createdUsers.length > 0) {
      const u = createdUsers.pop();
      if (u) await deleteTestUser(u.id);
    }
  });

  it("user A cannot read user B's wallets", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    createdUsers.push(alice, bob);

    // Alice inserts a wallet for herself.
    const { error: insertError } = await alice.client.from("wallets").insert({
      user_id: alice.id,
      name: "Conta secreta",
      account_type: "PF",
      balance_cents: 50_000,
    });
    expect(insertError).toBeNull();

    // Bob queries wallets; should NOT see Alice's.
    const { data: bobView } = await bob.client
      .from("wallets")
      .select("id, name")
      .eq("name", "Conta secreta");
    expect(bobView).toEqual([]);

    // Alice queries her own; should see it.
    const { data: aliceView } = await alice.client
      .from("wallets")
      .select("id, name")
      .eq("name", "Conta secreta");
    expect(aliceView).toHaveLength(1);
  });

  it("user A cannot read user B's contacts", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    createdUsers.push(alice, bob);

    await alice.client.from("contacts").insert({
      user_id: alice.id,
      name: "Confidant",
    });

    const { data: bobView } = await bob.client.from("contacts").select("id, name");
    expect(bobView).toEqual([]);

    const { data: aliceView } = await alice.client.from("contacts").select("id, name");
    expect(aliceView).toHaveLength(1);
    expect(aliceView?.[0]?.name).toBe("Confidant");
  });

  it("user A cannot insert rows on behalf of user B", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    createdUsers.push(alice, bob);

    const { error } = await alice.client.from("contacts").insert({
      user_id: bob.id,
      name: "Spoofed",
    });

    expect(error).not.toBeNull();
    expect(error?.code).toMatch(/42501|PGRST/i);
  });

  it("system categories are visible to every user; user categories are private", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    createdUsers.push(alice, bob);

    // System categories were inserted by seed.sql — both users should see them.
    const { data: aliceSystemCats } = await alice.client
      .from("categories")
      .select("id, name")
      .is("user_id", null);
    const { data: bobSystemCats } = await bob.client
      .from("categories")
      .select("id, name")
      .is("user_id", null);

    expect((aliceSystemCats?.length ?? 0) > 0).toBe(true);
    expect(aliceSystemCats?.length).toBe(bobSystemCats?.length);

    // Alice creates a custom category.
    await alice.client.from("categories").insert({
      user_id: alice.id,
      name: "Alice-only",
    });

    const { data: bobView } = await bob.client
      .from("categories")
      .select("id, name")
      .eq("name", "Alice-only");
    expect(bobView).toEqual([]);
  });

  it("banks are shared-readable", async () => {
    const alice = await createTestUser();
    createdUsers.push(alice);

    const { data: banks } = await alice.client.from("banks").select("id, name");
    expect((banks?.length ?? 0) > 0).toBe(true);
  });

  it("default 'Outros' wallet cannot be deleted by its owner", async () => {
    const alice = await createTestUser();
    createdUsers.push(alice);

    const { data: walletsBefore } = await alice.client
      .from("wallets")
      .select("id, name, is_default")
      .eq("is_default", true);

    expect(walletsBefore).toHaveLength(1);
    const outrosId = walletsBefore?.[0]?.id;
    if (!outrosId) throw new Error("Outros wallet missing");

    const { error } = await alice.client.from("wallets").delete().eq("id", outrosId);
    // Delete policy excludes default wallet; affected rows = 0, no error.

    const { data: walletsAfter } = await alice.client
      .from("wallets")
      .select("id")
      .eq("id", outrosId);
    expect(walletsAfter).toHaveLength(1);
    expect(error).toBeNull();
  });
});
