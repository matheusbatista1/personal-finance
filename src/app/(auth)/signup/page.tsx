import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";
import { getOptionalUser } from "@/lib/auth";

export const metadata = {
  title: "Criar conta — FinLux",
};

export default async function SignupPage() {
  // Defense in depth — the middleware already redirects authenticated users
  // away from auth pages, but the page double-checks in case it's missed.
  const user = await getOptionalUser();
  if (user) redirect("/");

  return (
    <AuthShell mode="signup">
      <SignupForm />
    </AuthShell>
  );
}
