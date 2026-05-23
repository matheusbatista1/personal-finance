import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const supportedLocales = ["pt-BR", "en"] as const;
export type Locale = (typeof supportedLocales)[number];
export const defaultLocale: Locale = "pt-BR";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isSupportedLocale(value: string | undefined | null): value is Locale {
  return Boolean(value) && (supportedLocales as readonly string[]).includes(value as string);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const stored = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isSupportedLocale(stored) ? stored : defaultLocale;
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return { locale, messages };
});
