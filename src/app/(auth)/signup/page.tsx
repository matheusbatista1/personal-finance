import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = {
  title: "Criar conta — FinLux",
};

export default function SignupPage() {
  return (
    <AuthCard
      title="Crie sua conta"
      subtitle="Comece a organizar suas finanças com elegância."
      footer={
        <p className="text-label-sm text-on-surface-variant font-mono">
          Já tem conta?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
