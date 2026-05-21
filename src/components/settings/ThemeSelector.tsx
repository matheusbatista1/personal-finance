"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";

const options = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Escuro", Icon: Moon },
  { value: "system", label: "Sistema", Icon: MonitorSmartphone },
] as const;

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = mounted ? theme : undefined;

  return (
    <div role="radiogroup" aria-label="Tema visual" className="gap-base grid grid-cols-3">
      {options.map(({ value, label, Icon }) => {
        const active = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cn(
              "gap-xs py-sm flex flex-col items-center justify-center rounded-xl border transition-all",
              active
                ? "border-primary bg-primary-container/20 text-primary"
                : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface",
            )}
          >
            <Icon size={20} aria-hidden />
            <span className="text-label-sm font-mono uppercase">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
