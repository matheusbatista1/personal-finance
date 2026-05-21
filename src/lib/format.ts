const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

export function formatBRLCompact(cents: number): string {
  const value = cents / 100;
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1)}k`;
  }
  return brl.format(value);
}

const competenceFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

export function formatCompetence(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  const raw = competenceFormatter.format(date);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function parseCompetence(input: string): { year: number; month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(input);
  if (!match) {
    throw new Error(`Invalid competence "${input}". Expected YYYY-MM.`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month ${month} in competence "${input}".`);
  }
  return { year, month };
}

export function currentCompetence(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function shiftCompetence(input: string, delta: number): string {
  const { year, month } = parseCompetence(input);
  const date = new Date(year, month - 1 + delta, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
