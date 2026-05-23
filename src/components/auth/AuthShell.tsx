import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/ui/Logo";

type Mode = "signin" | "signup";

interface AuthShellProps {
  mode: Mode;
  children: React.ReactNode;
}

export async function AuthShell({ mode, children }: AuthShellProps) {
  const t = await getTranslations("auth");
  const title = mode === "signin" ? t("signIn") : t("signUp");
  const toggleLabel = mode === "signin" ? t("signUp") : t("alreadyHaveAccount");
  const toggleHref = mode === "signin" ? "/signup" : "/login";

  return (
    <div
      className="glass-panel reveal-anim p-md md:p-lg w-full max-w-[440px] rounded-[32px]"
      style={{ animationDelay: "0.4s" }}
    >
      <div className="mb-lg gap-xs flex flex-col items-center text-center">
        <Logo size={64} glow />
        <h1 className="mt-sm text-headline-md text-primary font-sans font-semibold tracking-tight">
          FinLux
        </h1>
        <p className="text-label-sm text-on-surface-variant font-mono tracking-widest uppercase">
          {t("tagline")}
        </p>
      </div>

      <div className="mb-lg flex items-center justify-between">
        <h2 className="text-headline-lg text-on-surface font-sans font-semibold">{title}</h2>
        <Link
          href={toggleHref}
          className="text-label-md text-primary hover:text-on-surface font-mono transition-colors"
        >
          {toggleLabel}
        </Link>
      </div>

      {children}
    </div>
  );
}
