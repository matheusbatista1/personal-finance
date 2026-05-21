import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Entrar — FinLux",
};

export default function LoginPage() {
  return (
    <AuthShell mode="signin">
      <LoginForm />
    </AuthShell>
  );
}
