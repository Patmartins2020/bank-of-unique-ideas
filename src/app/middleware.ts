// middleware.ts (project root)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

function haveSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function getAdminEmail() {
  const raw =
    process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "";
  return raw.trim().toLowerCase();
}

export async function middleware(req: NextRequest) {
  // Matcher already limits to /dashboard/:path*, but we keep this guard for safety.
  if (!req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const adminEmail = getAdminEmail();
  if (!adminEmail) {
    // If admin email isn't configured, fail closed (no dashboard access).
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!haveSupabaseEnv()) {
    // If Supabase isn't configured, send user to login page.
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Create response FIRST (required by auth helpers)
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data, error } = await supabase.auth.getSession();

  if (error || !data?.session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const email = (data.session.user?.email || "").trim().toLowerCase();

  if (email !== adminEmail) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};