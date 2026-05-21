export type TransactionType = "income" | "expense";
export type SplitMode = "none" | "equal" | "custom";

export interface TransactionSplitParticipant {
  contactId: string;
  amountCents: number;
}

export interface Transaction {
  id: string;
  description: string;
  categoryLabel: string;
  iconName: string;
  occurredAt: Date;
  amountCents: number;
  type: TransactionType;
  splitMode: SplitMode;
  userIncludedInSplit: boolean;
  participants: TransactionSplitParticipant[];
  userShareCents: number;
}
