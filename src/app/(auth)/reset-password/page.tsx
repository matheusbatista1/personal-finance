import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Logo } from "@/components/ui/Logo";

export const metadata = {
  title: "Nova senha — FinLux",
};

/**
 * Landing for the password recovery magic link. The link auths the user via
 * `/auth/callback?next=/reset-password`, so the session is already valid by
 * the time this page renders — we just let them set a new password and bounce
 * them back to `/` to log in fresh.
 *
 * Unlike /signup and /forgot-password, this route DOES NOT redirect
 * already-logged-in users away: the recovery flow itself produces a logged-in
 * session and we need the user to land here to finish it.
 */
export default function ResetPasswordPage() {
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
          Nova senha
        </p>
      </div>

      <p className="text-body-md text-on-surface-variant mb-md font-sans">
        Escolha uma nova senha para a sua conta. Depois de salvar, você será redirecionado para o
        login.
      </p>

      <ResetPasswordForm />
    </div>
  );
}
