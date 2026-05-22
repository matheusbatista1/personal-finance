import type { ContactColorRole } from "@/domain/contact/Contact";

export interface ContactBreakdownRow {
  contactId: string;
  contactName: string;
  initial: string;
  colorRole: ContactColorRole;
  splitCents: number;
  individualCents: number;
  totalCents: number;
}

export type BadgeTone = "primary" | "tertiary" | "muted";

export interface ParticipantBadge {
  initial: string;
  colorRole: ContactColorRole | "primary";
}

export type TransactionFlow = "expense" | "income";

export interface RecentTransactionRow {
  id: string;
  type: TransactionFlow;
  description: string;
  categoryLabel: string;
  iconName: string;
  whenLabel: string;
  amountCents: number;
  participants: ParticipantBadge[];
  badge: {
    text: string;
    tone: BadgeTone;
  };
  installmentNumber: number;
  installmentTotal: number;
}

export interface AllContactsRow {
  id: string;
  name: string;
  initial: string;
  colorRole: ContactColorRole;
}

export interface SourceOptionRow {
  id: string;
  name: string;
}

export interface MonthlyDashboardDTO {
  competence: string;
  competenceLabel: string;
  user: {
    totalCents: number;
  };
  totalsAll: {
    totalCents: number;
  };
  income: {
    totalCents: number;
  };
  balance: {
    availableCents: number;
    deltaPct: number;
  };
  receivable: {
    amountCents: number;
    progress: number;
  };
  contactsBreakdown: ContactBreakdownRow[];
  recentTransactions: RecentTransactionRow[];
  allContacts: AllContactsRow[];
  allCards: SourceOptionRow[];
  allWallets: SourceOptionRow[];
}
