"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { signOut } from "@/actions/auth";

interface NavItem {
  href: string;
  key: "dashboard" | "wallet" | "transactions" | "reports" | "people";
  icon: LucideIcon;
}

const items: NavItem[] = [
  { href: "/", key: "dashboard", icon: LayoutDashboard },
  { href: "/carteira", key: "wallet", icon: Wallet },
  { href: "/transacoes", key: "transactions", icon: Receipt },
  { href: "/relatorios", key: "reports", icon: BarChart3 },
  { href: "/pessoas", key: "people", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");

  return (
    <nav className="border-outline-variant/20 bg-surface/80 fixed top-0 left-0 z-50 hidden h-screen w-64 flex-col border-r shadow-2xl backdrop-blur-2xl md:flex">
      <div className="gap-base p-lg flex h-full flex-col">
        <div className="mb-lg gap-xs flex flex-col">
          <Logo size={48} />

          <h2 className="mt-sm text-headline-md text-primary font-sans font-semibold tracking-tight">
            FinLux
          </h2>
          <p className="text-label-sm text-on-surface-variant font-mono">{tAuth("tagline")}</p>
        </div>

        <div className="gap-sm flex flex-1 flex-col">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "gap-sm px-sm py-sm flex scale-95 items-center rounded-lg transition-all duration-300 active:scale-90",
                  active
                    ? "border-primary bg-primary-container/10 text-primary border-r-4 font-semibold"
                    : "text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface",
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 2} aria-hidden />
                <span className="text-body-md">{tNav(item.key)}</span>
              </Link>
            );
          })}
        </div>

        <div className="gap-xs mt-auto flex flex-col">
          <Link
            href="/configuracoes"
            className="gap-sm px-sm py-sm text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface flex scale-95 items-center rounded-lg transition-all duration-300 active:scale-90"
          >
            <Settings size={20} aria-hidden />
            <span className="text-body-md">{tNav("settings")}</span>
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="gap-sm px-sm py-sm text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface flex w-full scale-95 items-center rounded-lg text-left transition-all duration-300 active:scale-90"
            >
              <LogOut size={20} aria-hidden />
              <span className="text-body-md">{tNav("signOut")}</span>
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
