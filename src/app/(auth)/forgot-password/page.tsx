import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Recuperar senha — FinLux",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Recuperar senha"
      subtitle="Vamos te enviar um link para criar uma nova senha."
      footer={
        <p className="text-label-sm text-on-surface-variant font-mono">
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Voltar para o login
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
