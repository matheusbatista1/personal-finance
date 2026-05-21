/**
 * Pure rateio engine. Given a transaction total and a list of participants
 * (each optionally with a fixed custom amount), distributes the value into
 * per-contact splits and the user's residual share.
 *
 * Invariant: sum(splits.amountCents) + userShareCents === input.amountCents.
 *
 * Rules (from CLAUDE.md):
 * - participants with `customAmountCents > 0` keep their fixed value.
 * - remaining contacts (no custom) form the "equal pool".
 * - the remainder (total minus customs) is divided equally among the equal pool
 *   plus the user when `userIncludedInSplit` is true.
 * - leftover cents from rounding go to the user when included, otherwise to the
 *   first equal-pool contacts (1 cent each).
 * - when the equal pool is empty, the remainder goes entirely to the user.
 */

export interface SplitParticipantInput {
  contactId: string;
  customAmountCents?: number | null;
}

export interface SplitInput {
  amountCents: number;
  participants: SplitParticipantInput[];
  userIncludedInSplit: boolean;
}

export interface SplitRow {
  contactId: string;
  amountCents: number;
}

export type SplitMode = "none" | "equal" | "custom";

export interface SplitResult {
  splits: SplitRow[];
  userShareCents: number;
  mode: SplitMode;
}

export class InvalidSplitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSplitError";
  }
}

export function calculateSplit({
  amountCents,
  participants,
  userIncludedInSplit,
}: SplitInput): SplitResult {
  if (!Number.isInteger(amountCents)) {
    throw new InvalidSplitError("Transaction amount must be an integer (cents).");
  }
  if (amountCents < 0) {
    throw new InvalidSplitError("Transaction amount cannot be negative.");
  }

  if (participants.length === 0) {
    return { splits: [], userShareCents: amountCents, mode: "none" };
  }

  const seenContacts = new Set<string>();
  for (const p of participants) {
    if (seenContacts.has(p.contactId)) {
      throw new InvalidSplitError("Duplicate contact in split.");
    }
    seenContacts.add(p.contactId);
    if (p.customAmountCents != null) {
      if (!Number.isInteger(p.customAmountCents)) {
        throw new InvalidSplitError("Custom amount must be an integer (cents).");
      }
      if (p.customAmountCents < 0) {
        throw new InvalidSplitError("Custom amount cannot be negative.");
      }
    }
  }

  const customs = participants.filter(
    (p) => p.customAmountCents != null && p.customAmountCents > 0,
  );
  const equalPool = participants.filter(
    (p) => p.customAmountCents == null || p.customAmountCents === 0,
  );

  const customTotal = customs.reduce((sum, p) => sum + (p.customAmountCents ?? 0), 0);
  if (customTotal > amountCents) {
    throw new InvalidSplitError("Custom amounts exceed the transaction total.");
  }

  const splits: SplitRow[] = customs.map((p) => ({
    contactId: p.contactId,
    amountCents: p.customAmountCents!,
  }));

  const remainder = amountCents - customTotal;
  let userShareCents = 0;

  if (equalPool.length === 0) {
    userShareCents = remainder;
  } else {
    const denominator = equalPool.length + (userIncludedInSplit ? 1 : 0);
    const perShare = Math.floor(remainder / denominator);
    let leftover = remainder - perShare * denominator;

    for (const participant of equalPool) {
      const extra = !userIncludedInSplit && leftover > 0 ? 1 : 0;
      splits.push({ contactId: participant.contactId, amountCents: perShare + extra });
      if (extra > 0) leftover -= 1;
    }

    if (userIncludedInSplit) {
      userShareCents = perShare + leftover;
    } else {
      userShareCents = 0;
    }
  }

  const mode: SplitMode = customs.length > 0 ? "custom" : "equal";
  return { splits, userShareCents, mode };
}
