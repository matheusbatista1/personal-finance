import { AuthBackground } from "@/components/auth/AuthBackground";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthBackground>{children}</AuthBackground>;
}
