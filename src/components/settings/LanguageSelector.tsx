"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { setLocale } from "@/actions/locale";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { value: "pt-BR", label: "Português (BR)", flag: "🇧🇷" },
  { value: "en", label: "English", flag: "🇺🇸" },
] as const;

export function LanguageSelector() {
  const current = useLocale();
  const [pending, startTransition] = useTransition();

  function choose(value: string) {
    if (value === current) return;
    startTransition(async () => {
      await setLocale(value);
    });
  }

  return (
    <div className="gap-xs flex">
      {LANGUAGES.map((lang) => {
        const active = current === lang.value;
        return (
          <button
            key={lang.value}
            type="button"
            onClick={() => choose(lang.value)}
            disabled={pending}
            className={cn(
              "gap-xs px-md py-sm text-label-md flex flex-1 cursor-pointer items-center justify-center rounded-full border font-mono transition-all",
              active
                ? "bg-primary-container/20 border-primary text-primary"
                : "bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-variant/40",
              pending ? "opacity-60" : "",
            )}
          >
            <span aria-hidden>{lang.flag}</span>
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
