/**
 * One-shot seed: wipes the target user's wallets/cards/contacts/transactions
 * and replaces with the contents of CF 2026.xlsx.
 *
 * Usage: npx tsx supabase/seed-real.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in env (.env.local).
 */
import * as path from "node:path";
import * as fs from "node:fs";
import * as XLSX from "xlsx";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const TARGET_EMAIL = "matheus.sbatista@outlook.com";
const FILE_PATH = path.resolve("stitch_purple_finance_premium", "CF 2026.xlsx");
const YEAR = 2026;

const SHEET_TO_MONTH: Record<string, number> = {
  Janeiro: 1,
  Fevereiro: 2,
  Março: 3,
  Abril: 4,
  Maio: 5,
  Junho: 6,
  Julho: 7,
  Agosto: 8,
  Setembro: 9,
  Outubro: 10,
  Novembro: 11,
  Dezembro: 12,
};

// Card column blocks discovered from inspection of Janeiro:
// Each block is 8 cols wide (VALOR, DATA, CATEGORIA, RATEIO, DESCRIÇÃO, PARCELA, TOTAL, gap)
interface CardColumnBlock {
  name: string;
  bankShort: string;
  accountType: "PF" | "PJ";
  valueCol: number;
  dateCol: number;
  categoryCol: number;
  rateioCol: number;
  descCol: number;
  parcelaCol: number;
  parcelaTotalCol: number;
  // The header row has "Fechamento:" + date_serial + "Limite total:" + amount in row 0
  closingDateCol: number;
  limitCol: number;
  dueDateCol: number;
  cardNameRow2Col: number; // where card name is in row 2
}

const CARD_BLOCKS: CardColumnBlock[] = [
  {
    name: "Nubank PJ",
    bankShort: "NU",
    accountType: "PJ",
    valueCol: 3,
    dateCol: 4,
    categoryCol: 5,
    rateioCol: 6,
    descCol: 7,
    parcelaCol: 8,
    parcelaTotalCol: 9,
    closingDateCol: 4,
    limitCol: 6,
    dueDateCol: 4,
    cardNameRow2Col: 3,
  },
  {
    name: "Nubank PF",
    bankShort: "NU",
    accountType: "PF",
    valueCol: 11,
    dateCol: 12,
    categoryCol: 13,
    rateioCol: 14,
    descCol: 15,
    parcelaCol: 16,
    parcelaTotalCol: 17,
    closingDateCol: 12,
    limitCol: 14,
    dueDateCol: 12,
    cardNameRow2Col: 11,
  },
  {
    name: "Caixa",
    bankShort: "CAIXA",
    accountType: "PF",
    valueCol: 19,
    dateCol: 20,
    categoryCol: 21,
    rateioCol: 22,
    descCol: 23,
    parcelaCol: 24,
    parcelaTotalCol: 25,
    closingDateCol: 20,
    limitCol: 22,
    dueDateCol: 20,
    cardNameRow2Col: 19,
  },
  {
    name: "C6 Bank",
    bankShort: "C6",
    accountType: "PF",
    valueCol: 27,
    dateCol: 28,
    categoryCol: 29,
    rateioCol: 30,
    descCol: 31,
    parcelaCol: 32,
    parcelaTotalCol: 33,
    closingDateCol: 28,
    limitCol: 30,
    dueDateCol: 28,
    cardNameRow2Col: 27,
  },
  {
    name: "Itaú",
    bankShort: "ITAU",
    accountType: "PF",
    valueCol: 35,
    dateCol: 36,
    categoryCol: 37,
    rateioCol: 38,
    descCol: 39,
    parcelaCol: 40,
    parcelaTotalCol: 41,
    closingDateCol: 36,
    limitCol: 38,
    dueDateCol: 36,
    cardNameRow2Col: 35,
  },
  {
    name: "Mercado Pago",
    bankShort: "MERCADOPAGO",
    accountType: "PF",
    valueCol: 43,
    dateCol: 44,
    categoryCol: 45,
    rateioCol: 46,
    descCol: 47,
    parcelaCol: 48,
    parcelaTotalCol: 49,
    closingDateCol: 44,
    limitCol: 46,
    dueDateCol: 44,
    cardNameRow2Col: 43,
  },
];

// VALORES VARIAVEIS block (wallet transactions): VALOR, DATA, CATEGORIA, DESCRIÇÃO, PARCELA, TOTAL
// No RATEIO column — these are all user's own expenses on the wallet.
const WALLET_BLOCK = {
  name: "Conta principal",
  valueCol: 51,
  dateCol: 52,
  categoryCol: 53,
  descCol: 54,
  parcelaCol: 55,
  parcelaTotalCol: 56,
};

// Mapping RATEIO emoji string to contact name. "EU" means user (no split).
function parseRateio(raw: unknown): { contact: string | null; divided: boolean } {
  if (!raw) return { contact: null, divided: false };
  const s = String(raw).toUpperCase();
  const divided = s.includes("DIVIDIDO");
  if (s.includes("EU")) return { contact: null, divided: false };
  if (s.includes("ARTHUR")) return { contact: "Arthur", divided };
  if (s.includes("MÃE") || s.includes("MAE")) return { contact: "Mãe", divided };
  if (s.includes("ISA")) return { contact: "Isa", divided };
  if (s.includes("GABRIELA")) return { contact: "Gabriela", divided };
  if (s.includes("GABRIEL")) return { contact: "Gabriel", divided };
  if (s.includes("JUNIO")) return { contact: "Junio", divided };
  if (s.includes("OUTROS")) return { contact: null, divided: false };
  return { contact: null, divided: false };
}

// Mapping CATEGORIA (with emoji) to one of the system category names.
function parseCategory(raw: unknown): string | null {
  if (!raw) return null;
  const s = String(raw).toLowerCase();
  if (s.includes("viagem")) return "Viagem";
  if (s.includes("assinatura")) return "Assinatura";
  if (s.includes("compras")) return "Compras";
  if (s.includes("transporte")) return "Transporte";
  if (s.includes("saúde") || s.includes("saude")) return "Saúde";
  if (s.includes("aurora") || s.includes("pet")) return "Pet";
  if (s.includes("mimo")) return "Mimo";
  if (s.includes("educação") || s.includes("educacao")) return "Educação";
  if (s.includes("alimentação") || s.includes("alimentacao")) return "Alimentação";
  if (s.includes("verificar")) return "Verificar";
  if (s.includes("pessoal")) return "Pessoal";
  if (s.includes("moradia")) return "Moradia";
  if (s.includes("profissional")) return "Profissional";
  return null;
}

function excelSerialToIso(serial: unknown, fallbackMonth: number): string {
  if (typeof serial === "number" && serial > 0) {
    // xlsx supports SSF date conversion. Excel epoch: 1899-12-30.
    const date = XLSX.SSF.parse_date_code(serial);
    if (date) {
      const yyyy = date.y;
      const mm = String(date.m).padStart(2, "0");
      const dd = String(date.d).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}T12:00:00Z`;
    }
  }
  // Fall back to first day of month
  return `${YEAR}-${String(fallbackMonth).padStart(2, "0")}-01T12:00:00Z`;
}

function toCents(value: unknown): number {
  if (typeof value !== "number") return 0;
  return Math.round(value * 100);
}

interface ParsedTx {
  amountCents: number;
  occurredAt: string;
  categoryLabel: string | null;
  contact: string | null;
  divided: boolean;
  description: string;
  installmentNumber: number;
  installmentTotal: number;
  type: "expense" | "income";
}

function parseCardColumn(aoa: unknown[][], block: CardColumnBlock, month: number): ParsedTx[] {
  const out: ParsedTx[] = [];
  // Data starts at row 4
  for (let r = 4; r < aoa.length; r++) {
    const row = aoa[r] ?? [];
    const valueRaw = row[block.valueCol];
    const amountCents = toCents(valueRaw);
    if (amountCents <= 0) continue;
    const desc = row[block.descCol];
    if (!desc) continue;
    const dateSerial = row[block.dateCol];
    const { contact, divided } = parseRateio(row[block.rateioCol]);
    const categoryLabel = parseCategory(row[block.categoryCol]);
    const parcelaN = typeof row[block.parcelaCol] === "number" ? Number(row[block.parcelaCol]) : 1;
    const parcelaT =
      typeof row[block.parcelaTotalCol] === "number" ? Number(row[block.parcelaTotalCol]) : 1;
    out.push({
      amountCents,
      occurredAt: excelSerialToIso(dateSerial, month),
      categoryLabel,
      contact,
      divided,
      description: String(desc).slice(0, 160),
      installmentNumber: parcelaN || 1,
      installmentTotal: parcelaT || 1,
      type: "expense",
    });
  }
  return out;
}

function parseWalletColumn(aoa: unknown[][], month: number): ParsedTx[] {
  const out: ParsedTx[] = [];
  for (let r = 4; r < aoa.length; r++) {
    const row = aoa[r] ?? [];
    const valueRaw = row[WALLET_BLOCK.valueCol];
    const amountCents = toCents(valueRaw);
    if (amountCents <= 0) continue;
    const desc = row[WALLET_BLOCK.descCol];
    if (!desc) continue;
    const dateSerial = row[WALLET_BLOCK.dateCol];
    const categoryLabel = parseCategory(row[WALLET_BLOCK.categoryCol]);
    const parcelaN =
      typeof row[WALLET_BLOCK.parcelaCol] === "number" ? Number(row[WALLET_BLOCK.parcelaCol]) : 1;
    const parcelaT =
      typeof row[WALLET_BLOCK.parcelaTotalCol] === "number"
        ? Number(row[WALLET_BLOCK.parcelaTotalCol])
        : 1;
    out.push({
      amountCents,
      occurredAt: excelSerialToIso(dateSerial, month),
      categoryLabel,
      contact: null,
      divided: false,
      description: String(desc).slice(0, 160),
      installmentNumber: parcelaN || 1,
      installmentTotal: parcelaT || 1,
      type: "expense",
    });
  }
  return out;
}

// Salário column: cols 54-55 use "DESCRIÇÃO" + values further right? Let me just skip income for now.

async function findUserId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw new Error(`list users: ${error.message}`);
  const user = data.users.find((u) => u.email === TARGET_EMAIL);
  if (!user) throw new Error(`user not found: ${TARGET_EMAIL}`);
  return user.id;
}

async function wipeUser(supabase: SupabaseClient, userId: string) {
  console.log("Wiping user data...");
  await supabase.from("transaction_splits").delete().eq("user_id", userId);
  await supabase.from("transactions").delete().eq("user_id", userId);
  await supabase.from("contacts").delete().eq("user_id", userId);
  await supabase.from("cards").delete().eq("user_id", userId);
  // Keep the default "Outros" wallet; wipe others
  await supabase.from("wallets").delete().eq("user_id", userId).eq("is_default", false);
  await supabase.from("categories").delete().eq("user_id", userId);
  await supabase.from("user_category_overrides").delete().eq("user_id", userId);
  console.log("  done.");
}

async function createWalletsAndCards(
  supabase: SupabaseClient,
  userId: string,
  walletPrincipalCents: number,
  cardLimitsByName: Map<string, { closingDay: number; dueDay: number; limitCents: number }>,
) {
  const { data: banks } = await supabase.from("banks").select("id, short_name");
  const bankIdByShort = new Map<string, string>();
  for (const b of banks ?? []) {
    bankIdByShort.set(b.short_name as string, b.id as string);
  }

  // Create Conta principal wallet
  const { data: principalWallet, error: walletErr } = await supabase
    .from("wallets")
    .insert({
      user_id: userId,
      name: "Conta principal",
      bank_id: null,
      account_type: "PF",
      balance_cents: walletPrincipalCents,
      is_default: false,
      is_active: true,
    })
    .select("id")
    .single();
  if (walletErr) throw new Error(`wallet create: ${walletErr.message}`);
  const principalWalletId = principalWallet.id as string;
  console.log(`  Wallet "Conta principal" → ${principalWalletId}`);

  // Cards: each block becomes one card on a fresh wallet (so available limit/used limit tracks correctly)
  const cardIdByName = new Map<string, string>();
  for (const block of CARD_BLOCKS) {
    const limits = cardLimitsByName.get(block.name) ?? {
      closingDay: 1,
      dueDay: 10,
      limitCents: 0,
    };
    const bankId = bankIdByShort.get(block.bankShort) ?? null;
    // One wallet per card holder so each card is isolated
    const { data: walletForCard, error: wErr } = await supabase
      .from("wallets")
      .insert({
        user_id: userId,
        name: `${block.name} (carteira)`,
        bank_id: bankId,
        account_type: block.accountType,
        balance_cents: 0,
        is_default: false,
        is_active: true,
      })
      .select("id")
      .single();
    if (wErr) throw new Error(`wallet ${block.name}: ${wErr.message}`);
    const { data: card, error: cErr } = await supabase
      .from("cards")
      .insert({
        user_id: userId,
        wallet_id: walletForCard.id as string,
        name: block.name,
        credit_limit_cents: limits.limitCents,
        color:
          block.bankShort === "NU"
            ? "#820AD1"
            : block.bankShort === "CAIXA"
              ? "#0070AF"
              : block.bankShort === "C6"
                ? "#242424"
                : block.bankShort === "ITAU"
                  ? "#EC7000"
                  : block.bankShort === "MERCADOPAGO"
                    ? "#009EE3"
                    : "#6b7280",
        closing_day: Math.min(28, Math.max(1, limits.closingDay)),
        due_day: Math.min(28, Math.max(1, limits.dueDay)),
        is_active: true,
      })
      .select("id")
      .single();
    if (cErr) throw new Error(`card ${block.name}: ${cErr.message}`);
    cardIdByName.set(block.name, card.id as string);
    console.log(`  Card "${block.name}" → ${card.id}`);
  }

  return { principalWalletId, cardIdByName };
}

async function createContacts(
  supabase: SupabaseClient,
  userId: string,
  names: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const name of names) {
    const { data, error } = await supabase
      .from("contacts")
      .insert({ user_id: userId, name })
      .select("id")
      .single();
    if (error) throw new Error(`contact ${name}: ${error.message}`);
    map.set(name, data.id as string);
  }
  return map;
}

async function getSystemCategories(supabase: SupabaseClient): Promise<Map<string, string>> {
  const { data, error } = await supabase.from("categories").select("id, name").is("user_id", null);
  if (error) throw new Error(`categories: ${error.message}`);
  const map = new Map<string, string>();
  for (const c of data ?? []) {
    map.set(c.name as string, c.id as string);
  }
  return map;
}

async function insertTransaction(
  supabase: SupabaseClient,
  userId: string,
  tx: ParsedTx,
  source: { walletId?: string; cardId?: string },
  categoryMap: Map<string, string>,
  contactMap: Map<string, string>,
): Promise<void> {
  const categoryId = tx.categoryLabel ? (categoryMap.get(tx.categoryLabel) ?? null) : null;
  const contactId = tx.contact ? (contactMap.get(tx.contact) ?? null) : null;

  let splitMode: "none" | "equal" | "custom" = "none";
  let userIncludedInSplit = true;
  let userShareCents = tx.amountCents;
  const splits: Array<{ contact_id: string; amount_cents: number; is_custom: boolean }> = [];

  if (contactId) {
    if (tx.divided) {
      // Equal between user and one contact: 50/50
      splitMode = "equal";
      userShareCents = Math.floor(tx.amountCents / 2);
      const contactShare = tx.amountCents - userShareCents;
      splits.push({ contact_id: contactId, amount_cents: contactShare, is_custom: false });
    } else {
      // Direct: full amount belongs to contact, user paid for them.
      splitMode = "custom";
      userIncludedInSplit = false;
      userShareCents = 0;
      splits.push({ contact_id: contactId, amount_cents: tx.amountCents, is_custom: true });
    }
  }

  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      wallet_id: source.walletId ?? null,
      card_id: source.cardId ?? null,
      category_id: categoryId,
      amount_cents: tx.amountCents,
      description: tx.description,
      occurred_at: tx.occurredAt,
      type: tx.type,
      operation: null,
      split_mode: splitMode,
      user_included_in_split: userIncludedInSplit,
      user_share_cents: userShareCents,
      installment_number: tx.installmentNumber,
      installment_total: tx.installmentTotal,
      installment_group_id: null,
      recurrence: "none",
      recurrence_group_id: null,
    })
    .select("id")
    .single();
  if (error || !inserted) {
    console.warn(`  ! failed to insert: ${tx.description} (${tx.amountCents}) — ${error?.message}`);
    return;
  }
  if (splits.length > 0) {
    const rows = splits.map((s) => ({
      user_id: userId,
      transaction_id: inserted.id,
      contact_id: s.contact_id,
      amount_cents: s.amount_cents,
      is_custom: s.is_custom,
      settled_at: null,
    }));
    const { error: splitErr } = await supabase.from("transaction_splits").insert(rows);
    if (splitErr) {
      console.warn(`  ! failed split for ${tx.description}: ${splitErr.message}`);
    }
  }
}

function extractCardLimits(
  aoa: unknown[][],
): Map<string, { closingDay: number; dueDay: number; limitCents: number }> {
  const map = new Map<string, { closingDay: number; dueDay: number; limitCents: number }>();
  for (const block of CARD_BLOCKS) {
    const closingSerial = aoa[0]?.[block.closingDateCol + 1]; // closingDateCol+1 is the date serial
    const limitVal = aoa[0]?.[block.limitCol + 1];
    const dueSerial = aoa[1]?.[block.dueDateCol + 1];

    const limitCents = toCents(limitVal);
    const closingDay = typeof closingSerial === "number" ? extractDay(closingSerial) : 1;
    const dueDay = typeof dueSerial === "number" ? extractDay(dueSerial) : 10;

    map.set(block.name, { closingDay, dueDay, limitCents });
  }
  return map;
}

function extractDay(serial: number): number {
  const parsed = XLSX.SSF.parse_date_code(serial);
  return parsed?.d ?? 1;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE env vars");
  }
  if (!fs.existsSync(FILE_PATH)) {
    throw new Error(`File not found: ${FILE_PATH}`);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const userId = await findUserId(supabase);
  console.log(`User: ${TARGET_EMAIL} (${userId})`);

  await wipeUser(supabase, userId);

  // Parse first sheet (Janeiro) to extract card limits (assumed stable across months).
  const wb = XLSX.readFile(FILE_PATH);
  const firstSheet = wb.Sheets[wb.SheetNames[0] ?? "Janeiro"];
  if (!firstSheet) throw new Error("Janeiro sheet missing");
  const firstAoa = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
    header: 1,
    raw: true,
    defval: null,
  });
  const cardLimits = extractCardLimits(firstAoa);

  // Initial wallet balance: take "Salário:" value from row 0 of Janeiro (col 54).
  // Quick heuristic: 0 — user can set later.
  const walletBalance = 0;

  const { principalWalletId, cardIdByName } = await createWalletsAndCards(
    supabase,
    userId,
    walletBalance,
    cardLimits,
  );

  const contactMap = await createContacts(supabase, userId, [
    "Arthur",
    "Mãe",
    "Isa",
    "Gabriela",
    "Gabriel",
    "Junio",
  ]);

  const categoryMap = await getSystemCategories(supabase);

  let totalInserted = 0;
  for (const [sheetName, monthNumber] of Object.entries(SHEET_TO_MONTH)) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
      defval: null,
    });
    console.log(`\n=== Sheet "${sheetName}" → month ${monthNumber} ===`);

    let monthCount = 0;
    for (const block of CARD_BLOCKS) {
      const txs = parseCardColumn(aoa, block, monthNumber);
      const cardId = cardIdByName.get(block.name);
      if (!cardId) continue;
      for (const tx of txs) {
        await insertTransaction(supabase, userId, tx, { cardId }, categoryMap, contactMap);
        monthCount++;
      }
      console.log(`  ${block.name}: ${txs.length} tx`);
    }

    const walletTxs = parseWalletColumn(aoa, monthNumber);
    for (const tx of walletTxs) {
      await insertTransaction(
        supabase,
        userId,
        tx,
        { walletId: principalWalletId },
        categoryMap,
        contactMap,
      );
      monthCount++;
    }
    console.log(`  Conta principal: ${walletTxs.length} tx`);
    console.log(`  TOTAL "${sheetName}": ${monthCount}`);
    totalInserted += monthCount;
  }

  console.log(`\n✓ Total transactions inserted: ${totalInserted}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
