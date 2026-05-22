import type { MonthlyDashboardDTO } from "@/application/dto/MonthlyDashboardDTO";
import type {
  DashboardQuery,
  IDashboardRepository,
} from "@/application/repositories/IDashboardRepository";
import { formatCompetence } from "@/lib/format";

/**
 * Mock fixtures that mirror the Stitch `Dashboard Macro Mensal` screen (1:1 with the screenshot).
 * Same values are returned for every competence — month navigation works visually
 * but produces identical data until a real repository is wired in the next round.
 */
export class InMemoryDashboardRepository implements IDashboardRepository {
  async findByCompetence(input: DashboardQuery): Promise<MonthlyDashboardDTO> {
    const { year, month } = input;
    const competence = `${year}-${String(month).padStart(2, "0")}`;

    return {
      competence,
      competenceLabel: formatCompetence(year, month),
      user: {
        totalCents: 910_239,
      },
      totalsAll: {
        totalCents: 1_544_412,
      },
      income: {
        totalCents: 0,
      },
      balance: {
        availableCents: 1_245_000,
        deltaPct: 5.2,
      },
      receivable: {
        amountCents: 320_050,
        progress: 0.66,
      },
      contactsBreakdown: [
        {
          contactId: "arthur",
          contactName: "Arthur",
          initial: "A",
          colorRole: "primary",
          splitCents: 0,
          individualCents: 65_499,
          totalCents: 65_499,
        },
        {
          contactId: "mae",
          contactName: "Mãe",
          initial: "M",
          colorRole: "tertiary",
          splitCents: 9_247,
          individualCents: 394_248,
          totalCents: 403_495,
        },
      ],
      recentTransactions: [
        {
          id: "tx-fogo-de-chao",
          type: "expense",
          description: "Fogo de Chão",
          categoryLabel: "Alimentação",
          iconName: "Utensils",
          whenLabel: "Hoje, 20:30",
          amountCents: -45_000,
          participants: [
            { initial: "EU", colorRole: "primary" },
            { initial: "A", colorRole: "primary" },
          ],
          badge: { text: "Dividido 50%", tone: "primary" },
          installmentNumber: 1,
          installmentTotal: 1,
        },
        {
          id: "tx-uber",
          type: "expense",
          description: "Uber",
          categoryLabel: "Transporte",
          iconName: "Car",
          whenLabel: "Hoje, 18:15",
          amountCents: -4_590,
          participants: [],
          badge: { text: "Individual", tone: "muted" },
          installmentNumber: 1,
          installmentTotal: 1,
        },
        {
          id: "tx-condominio",
          type: "expense",
          description: "Condomínio",
          categoryLabel: "Moradia",
          iconName: "Home",
          whenLabel: "Ontem",
          amountCents: -120_000,
          participants: [{ initial: "M", colorRole: "tertiary" }],
          badge: { text: "Mãe Total", tone: "tertiary" },
          installmentNumber: 1,
          installmentTotal: 1,
        },
      ],
      allContacts: [
        { id: "arthur", name: "Arthur", initial: "A", colorRole: "primary" },
        { id: "mae", name: "Mãe", initial: "M", colorRole: "tertiary" },
      ],
      allCards: [],
      allWallets: [],
    };
  }
}
