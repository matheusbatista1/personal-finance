import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Entrar — FinLux",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Bem-vindo de volta"
      subtitle="Acesse sua conta FinLux para continuar."
      footer={
        <p className="text-label-sm text-on-surface-variant font-mono">
          Não tem conta?{" "}
          <Link href="/signup" className="text-primary font-semibold hover:underline">
            Criar agora
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
