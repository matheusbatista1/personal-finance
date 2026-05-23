import Link from "next/link";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { getOptionalUser } from "@/lib/auth";

export const metadata = {
  title: "Recuperar senha — FinLux",
};

export default async function ForgotPasswordPage() {
  const user = await getOptionalUser();
  if (user) redirect("/");

  return (
    <div
      className="glass-panel reveal-anim p-md md:p-lg w-full max-w-[440px] rounded-[32px]"
      style={{ animationDelay: "0.4s" }}
    >
      <div className="mb-lg gap-xs flex flex-col">
        <h2 className="text-headline-lg text-on-surface font-sans font-semibold">
          Recuperar senha
        </h2>
        <p className="text-body-md text-on-surface-variant font-sans">
          Enviaremos um link para você criar uma nova senha.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-label-sm mt-lg text-center font-mono">
        <Link href="/" className="text-primary hover:text-on-surface transition-colors">
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
