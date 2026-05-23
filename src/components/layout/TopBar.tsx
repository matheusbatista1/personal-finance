import Link from "next/link";
import { Plus } from "lucide-react";
import { MonthQuickPicker } from "@/components/layout/MonthQuickPicker";
import { AvatarMenu } from "@/components/layout/AvatarMenu";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/infrastructure/database/supabase/server";

export async function TopBar() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const profile = data.user
    ? await supabase.from("profiles").select("display_name").eq("id", data.user.id).maybeSingle()
    : null;
  const displayName =
    (profile?.data?.display_name as string | undefined) ?? data.user?.email ?? "?";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="border-outline-variant/10 bg-surface/60 px-lg py-md fixed top-0 right-0 z-40 flex w-full items-center justify-between border-b backdrop-blur-xl md:ml-64 md:w-[calc(100%-256px)]">
      <div className="gap-sm flex items-center">
        <Logo size={28} />
        <h1 className="text-headline-md text-primary font-sans font-semibold">FinLux</h1>
      </div>
      <div className="gap-md flex items-center">
        <MonthQuickPicker />
        <Link
          href="/gastos/novo"
          aria-label="Novo lançamento"
          className="text-on-surface-variant hover:bg-primary-container/20 hover:text-primary focus-visible:ring-primary/50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-all focus-visible:ring-2 focus-visible:ring-offset-0"
        >
          <Plus size={22} aria-hidden />
        </Link>
        <AvatarMenu initial={initial} />
      </div>
    </header>
  );
}
