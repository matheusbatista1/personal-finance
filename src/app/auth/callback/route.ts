import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * OAuth + magic-link callback. We build the redirect response up-front so the
 * Supabase SDK can attach the freshly-issued session cookies directly to it.
 * Relying on `cookies()` from next/headers was racing with the redirect on the
 * very first sign-in, causing the user to bounce back to `/` once before
 * the session settled.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const explicitNext = searchParams.get("next");

  // Default landing is the root (which renders the dashboard for authenticated
  // users). Specific flows pass `next` explicitly (e.g. password reset).
  const target = explicitNext ?? "/";

  const failureResponse = NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
  if (!code) return failureResponse;

  const response = NextResponse.redirect(`${origin}${target}`);

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return failureResponse;

  // Force the SDK to read the new session back so any refresh-token cookies
  // are flushed onto the response before we hand control to the middleware.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return failureResponse;

  return response;
}
