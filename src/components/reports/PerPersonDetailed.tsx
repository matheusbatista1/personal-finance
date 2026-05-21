import { formatBRL } from "@/lib/format";

export interface PersonReportTransaction {
  id: string;
  date: string;
  description: string;
  amountCents: number;
  installmentLabel: string | null;
}

export interface PersonReportBlock {
  contactId: string;
  name: string;
  isUser: boolean;
  totalCents: number;
  transactions: PersonReportTransaction[];
}

interface Props {
  blocks: PersonReportBlock[];
}

export function PerPersonDetailed({ blocks }: Props) {
  return (
    <section className="glass-panel p-md md:p-lg rounded-2xl">
      <header className="mb-md">
        <h3 className="text-headline-md text-on-surface font-sans font-semibold">
          Por pessoa — detalhado
        </h3>
        <p className="text-label-sm text-on-surface-variant font-mono">
          Quem deve pagar o quê, com a relação completa das transações que entram no rateio.
        </p>
      </header>

      <div className="space-y-md">
        {blocks.map((block) => (
          <article key={block.contactId} className="bg-surface-container-low p-md rounded-xl">
            <div className="mb-sm flex items-center justify-between">
              <h4
                className={`text-body-lg font-sans font-semibold ${block.isUser ? "text-primary" : "text-on-surface"}`}
              >
                {block.isUser ? "EU" : block.name}
              </h4>
              <span className="text-label-md text-on-surface font-mono font-semibold">
                {formatBRL(block.totalCents)}
              </span>
            </div>
            {block.transactions.length === 0 ? (
              <p className="text-label-sm text-on-surface-variant font-mono">
                Sem transações neste período.
              </p>
            ) : (
              <ul className="space-y-base">
                {block.transactions.map((tx) => (
                  <li
                    key={tx.id}
                    className="border-outline-variant/10 pb-base flex items-center justify-between border-b last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-body-md text-on-surface font-sans">
                        {tx.description}
                        {tx.installmentLabel ? (
                          <span className="text-label-sm text-on-surface-variant ml-2 font-mono">
                            {tx.installmentLabel}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-label-sm text-on-surface-variant font-mono">{tx.date}</p>
                    </div>
                    <span className="text-label-md text-on-surface font-mono">
                      {formatBRL(tx.amountCents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
