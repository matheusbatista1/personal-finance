import { describe, expect, it } from "vitest";
import { InvalidSplitError, calculateSplit } from "@/application/services/splitCalculator";

const arthur = "contact-arthur";
const mae = "contact-mae";
const isa = "contact-isa";

describe("calculateSplit — mode: none", () => {
  it("returns full amount as user share when no participants", () => {
    const result = calculateSplit({
      amountCents: 30_000,
      participants: [],
      userIncludedInSplit: true,
    });
    expect(result.mode).toBe("none");
    expect(result.splits).toEqual([]);
    expect(result.userShareCents).toBe(30_000);
  });

  it("still 'none' when userIncludedInSplit is false and no participants", () => {
    const result = calculateSplit({
      amountCents: 12_345,
      participants: [],
      userIncludedInSplit: false,
    });
    expect(result.mode).toBe("none");
    expect(result.userShareCents).toBe(12_345);
  });

  it("handles zero amount with no participants", () => {
    const result = calculateSplit({
      amountCents: 0,
      participants: [],
      userIncludedInSplit: true,
    });
    expect(result.userShareCents).toBe(0);
    expect(result.splits).toEqual([]);
  });
});

describe("calculateSplit — mode: equal", () => {
  it("splits evenly between user and one contact when Dividido ON", () => {
    const result = calculateSplit({
      amountCents: 30_000,
      participants: [{ contactId: arthur }],
      userIncludedInSplit: true,
    });
    expect(result.mode).toBe("equal");
    expect(result.userShareCents).toBe(15_000);
    expect(result.splits).toEqual([{ contactId: arthur, amountCents: 15_000 }]);
  });

  it("splits evenly between user and N contacts when Dividido ON", () => {
    const result = calculateSplit({
      amountCents: 30_000,
      participants: [{ contactId: arthur }, { contactId: mae }, { contactId: isa }],
      userIncludedInSplit: true,
    });
    expect(result.userShareCents).toBe(7_500);
    expect(result.splits).toEqual([
      { contactId: arthur, amountCents: 7_500 },
      { contactId: mae, amountCents: 7_500 },
      { contactId: isa, amountCents: 7_500 },
    ]);
  });

  it("user pays nothing when Dividido OFF (I paid for them)", () => {
    const result = calculateSplit({
      amountCents: 10_000,
      participants: [{ contactId: arthur }, { contactId: mae }],
      userIncludedInSplit: false,
    });
    expect(result.userShareCents).toBe(0);
    expect(result.splits).toEqual([
      { contactId: arthur, amountCents: 5_000 },
      { contactId: mae, amountCents: 5_000 },
    ]);
  });

  it("distributes rounding leftover to user when Dividido ON", () => {
    // 100 cents split among user + Arthur + Mãe + Isa (4 ways)
    // 100 / 4 = 25 exactly, no leftover
    const exact = calculateSplit({
      amountCents: 100,
      participants: [{ contactId: arthur }, { contactId: mae }, { contactId: isa }],
      userIncludedInSplit: true,
    });
    expect(exact.userShareCents).toBe(25);
    expect(exact.splits.every((s) => s.amountCents === 25)).toBe(true);

    // 1 cent / 4 = 0, leftover = 1, goes to user
    const leftover = calculateSplit({
      amountCents: 1,
      participants: [{ contactId: arthur }, { contactId: mae }, { contactId: isa }],
      userIncludedInSplit: true,
    });
    expect(leftover.userShareCents).toBe(1);
    expect(leftover.splits.every((s) => s.amountCents === 0)).toBe(true);
  });

  it("distributes rounding leftover to first contacts when Dividido OFF", () => {
    // 99 cents split among Arthur + Mãe (no user)
    // 99 / 2 = 49, leftover 1, goes to first contact
    const result = calculateSplit({
      amountCents: 99,
      participants: [{ contactId: arthur }, { contactId: mae }],
      userIncludedInSplit: false,
    });
    expect(result.userShareCents).toBe(0);
    expect(result.splits).toEqual([
      { contactId: arthur, amountCents: 50 },
      { contactId: mae, amountCents: 49 },
    ]);
    const sum = result.splits.reduce((s, r) => s + r.amountCents, 0) + result.userShareCents;
    expect(sum).toBe(99);
  });
});

describe("calculateSplit — mode: custom", () => {
  it("CLAUDE.md example: R$ 300 lunch, Arthur pays R$ 59, rest is user's", () => {
    const result = calculateSplit({
      amountCents: 30_000,
      participants: [{ contactId: arthur, customAmountCents: 5_900 }],
      userIncludedInSplit: true,
    });
    expect(result.mode).toBe("custom");
    expect(result.splits).toEqual([{ contactId: arthur, amountCents: 5_900 }]);
    expect(result.userShareCents).toBe(24_100);
  });

  it("custom only with multiple contacts; remainder to user", () => {
    const result = calculateSplit({
      amountCents: 50_000,
      participants: [
        { contactId: arthur, customAmountCents: 10_000 },
        { contactId: mae, customAmountCents: 15_000 },
      ],
      userIncludedInSplit: true,
    });
    expect(result.mode).toBe("custom");
    expect(result.userShareCents).toBe(25_000);
  });

  it("Dividido OFF with custom only: remainder still goes to user", () => {
    const result = calculateSplit({
      amountCents: 30_000,
      participants: [{ contactId: arthur, customAmountCents: 20_000 }],
      userIncludedInSplit: false,
    });
    expect(result.userShareCents).toBe(10_000);
    expect(result.splits).toEqual([{ contactId: arthur, amountCents: 20_000 }]);
  });

  it("rejects when custom amounts exceed transaction total", () => {
    expect(() =>
      calculateSplit({
        amountCents: 10_000,
        participants: [
          { contactId: arthur, customAmountCents: 6_000 },
          { contactId: mae, customAmountCents: 5_000 },
        ],
        userIncludedInSplit: true,
      }),
    ).toThrow(InvalidSplitError);
  });
});

describe("calculateSplit — mode: custom + equal mixed", () => {
  it("custom contact + equal pool divides remainder, Dividido ON", () => {
    // R$ 300, Arthur custom R$ 59, Mãe in equal pool, Dividido ON.
    // remainder = 241 cents.. wait we need to use full cents: 30_000 - 5_900 = 24_100
    // 24_100 / 2 (Mãe + user) = 12_050 each
    const result = calculateSplit({
      amountCents: 30_000,
      participants: [{ contactId: arthur, customAmountCents: 5_900 }, { contactId: mae }],
      userIncludedInSplit: true,
    });
    expect(result.mode).toBe("custom");
    expect(result.splits).toEqual([
      { contactId: arthur, amountCents: 5_900 },
      { contactId: mae, amountCents: 12_050 },
    ]);
    expect(result.userShareCents).toBe(12_050);
    const sum = result.splits.reduce((s, r) => s + r.amountCents, 0) + result.userShareCents;
    expect(sum).toBe(30_000);
  });

  it("custom contact + equal pool, Dividido OFF: only equal-pool contacts share", () => {
    const result = calculateSplit({
      amountCents: 30_000,
      participants: [{ contactId: arthur, customAmountCents: 5_900 }, { contactId: mae }],
      userIncludedInSplit: false,
    });
    expect(result.splits).toEqual([
      { contactId: arthur, amountCents: 5_900 },
      { contactId: mae, amountCents: 24_100 },
    ]);
    expect(result.userShareCents).toBe(0);
  });

  it("multiple customs + multiple equal-pool, Dividido ON, with rounding", () => {
    // 999 cents
    // customs: Arthur 100, Mãe 200 -> customTotal 300, remainder 699
    // equal pool: Isa + (user) = 2
    // 699/2 = 349.5 -> perShare 349, leftover 1 -> user gets 350
    const result = calculateSplit({
      amountCents: 999,
      participants: [
        { contactId: arthur, customAmountCents: 100 },
        { contactId: mae, customAmountCents: 200 },
        { contactId: isa },
      ],
      userIncludedInSplit: true,
    });
    expect(result.splits).toEqual([
      { contactId: arthur, amountCents: 100 },
      { contactId: mae, amountCents: 200 },
      { contactId: isa, amountCents: 349 },
    ]);
    expect(result.userShareCents).toBe(350);
    const sum = result.splits.reduce((s, r) => s + r.amountCents, 0) + result.userShareCents;
    expect(sum).toBe(999);
  });
});

describe("calculateSplit — invariants and edge cases", () => {
  it("sum(splits) + userShare === amountCents for every result", () => {
    const cases = [
      { amount: 10_000, participants: [{ contactId: arthur }], divid: true },
      { amount: 7, participants: [{ contactId: arthur }, { contactId: mae }], divid: true },
      {
        amount: 50_000,
        participants: [{ contactId: arthur, customAmountCents: 12_345 }, { contactId: mae }],
        divid: false,
      },
      {
        amount: 33,
        participants: [
          { contactId: arthur, customAmountCents: 10 },
          { contactId: mae },
          { contactId: isa },
        ],
        divid: true,
      },
    ];

    for (const c of cases) {
      const result = calculateSplit({
        amountCents: c.amount,
        participants: c.participants,
        userIncludedInSplit: c.divid,
      });
      const sum = result.splits.reduce((s, r) => s + r.amountCents, 0) + result.userShareCents;
      expect(sum).toBe(c.amount);
    }
  });

  it("rejects negative amounts", () => {
    expect(() =>
      calculateSplit({
        amountCents: -1,
        participants: [{ contactId: arthur }],
        userIncludedInSplit: true,
      }),
    ).toThrow(InvalidSplitError);
  });

  it("rejects non-integer amounts (cents must be integers)", () => {
    expect(() =>
      calculateSplit({
        amountCents: 100.5,
        participants: [{ contactId: arthur }],
        userIncludedInSplit: true,
      }),
    ).toThrow(InvalidSplitError);
  });

  it("rejects duplicate contacts in participants", () => {
    expect(() =>
      calculateSplit({
        amountCents: 100,
        participants: [{ contactId: arthur }, { contactId: arthur }],
        userIncludedInSplit: true,
      }),
    ).toThrow(InvalidSplitError);
  });

  it("rejects negative custom amounts", () => {
    expect(() =>
      calculateSplit({
        amountCents: 100,
        participants: [{ contactId: arthur, customAmountCents: -10 }],
        userIncludedInSplit: true,
      }),
    ).toThrow(InvalidSplitError);
  });

  it("treats customAmountCents of 0 as equal-pool", () => {
    const result = calculateSplit({
      amountCents: 100,
      participants: [{ contactId: arthur, customAmountCents: 0 }],
      userIncludedInSplit: true,
    });
    expect(result.mode).toBe("equal");
    expect(result.splits).toEqual([{ contactId: arthur, amountCents: 50 }]);
    expect(result.userShareCents).toBe(50);
  });
});
