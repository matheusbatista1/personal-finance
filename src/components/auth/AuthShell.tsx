import Link from "next/link";

type Mode = "signin" | "signup";

interface AuthShellProps {
  mode: Mode;
  children: React.ReactNode;
}

const copy = {
  signin: {
    title: "Entrar",
    toggleLabel: "Criar conta",
    toggleHref: "/signup",
  },
  signup: {
    title: "Criar conta",
    toggleLabel: "Já tenho conta",
    toggleHref: "/login",
  },
} as const;

export function AuthShell({ mode, children }: AuthShellProps) {
  const { title, toggleLabel, toggleHref } = copy[mode];

  return (
    <div
      className="glass-panel reveal-anim p-md md:p-lg w-full max-w-[440px] rounded-[32px]"
      style={{ animationDelay: "0.4s" }}
    >
      <div className="mb-lg flex items-center justify-between">
        <h2 className="text-headline-lg text-on-surface font-sans font-semibold">{title}</h2>
        <Link
          href={toggleHref}
          className="text-label-md text-primary hover:text-on-surface font-mono transition-colors"
        >
          {toggleLabel}
        </Link>
      </div>

      <GoogleStubButton />

      <div className="my-lg gap-base flex items-center">
        <div className="bg-outline-variant/30 h-px flex-1" />
        <span className="text-label-sm text-outline font-mono tracking-widest uppercase">
          Ou continue com e-mail
        </span>
        <div className="bg-outline-variant/30 h-px flex-1" />
      </div>

      {children}
    </div>
  );
}

function GoogleStubButton() {
  return (
    <button
      type="button"
      disabled
      aria-label="Continuar com Google (em breve)"
      title="Em breve"
      className="glass-panel gap-base py-sm text-body-md text-on-surface flex w-full items-center justify-center rounded-xl font-sans transition-all hover:bg-white/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M12 5.04c1.94 0 3.68.67 5.05 1.97l3.78-3.78C18.53 1.18 15.5 0 12 0 7.33 0 3.32 2.69 1.4 6.65l4.35 3.37C6.8 7.3 9.18 5.04 12 5.04z"
          fill="#EA4335"
        />
        <path
          d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.9c2.18-2.02 3.44-4.99 3.44-8.72z"
          fill="#4285F4"
        />
        <path
          d="M5.75 14.52c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V6.97H1.4C.51 8.68 0 10.6 0 12.6s.51 3.92 1.4 5.63l4.35-3.71z"
          fill="#FBBC05"
        />
        <path
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.73-2.9c-1.1.74-2.51 1.17-4.2 1.17-3.23 0-5.96-2.18-6.95-5.11L1.4 17.96C3.32 21.31 7.33 24 12 24z"
          fill="#34A853"
        />
      </svg>
      Continuar com Google
      <span className="text-label-sm text-on-surface-variant ml-xs font-mono">(em breve)</span>
    </button>
  );
}
