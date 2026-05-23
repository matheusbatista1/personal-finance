import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

// Auth-gated routes that require a session. The root `/` is handled by the
// page itself (renders login or dashboard based on auth), so it is NOT listed
// here — otherwise unauthenticated visitors would be redirected away from the
// page that's supposed to show them the login form.
const PROTECTED_PREFIXES = [
  "/carteira",
  "/transacoes",
  "/pessoas",
  "/configuracoes",
  "/gastos",
  "/fatura",
  "/perfil",
  "/relatorios",
];

// Public auth flows. Authenticated users hitting these are bounced back to `/`.
// `/reset-password` is intentionally NOT here — the recovery magic link signs
// the user in just long enough to set the new password, so we need to let
// them through even when "authenticated".
const AUTH_PAGES = ["/signup", "/forgot-password"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
