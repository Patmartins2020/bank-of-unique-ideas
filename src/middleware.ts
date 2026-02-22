// middleware.ts (put at project root OR src/middleware.ts)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

function haveSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function getAdminEmail() {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "";
  return raw.trim().toLowerCase();
}

function isAdminRoute(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/dashboard");
}

function isInvestorRoute(pathname: string) {
  return pathname.startsWith("/investor");
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Only handle the routes we care about (keeps it safe and fast)
  const shouldHandle = isAdminRoute(pathname) || isInvestorRoute(pathname);
  if (!shouldHandle) return NextResponse.next();

  // If Supabase env is missing, force login (prevents confusing runtime errors)
  if (!haveSupabaseEnv()) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Create response FIRST (required by auth-helpers)
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data, error } = await supabase.auth.getSession();
  const session = data?.session;

  // Investor + Admin routes require login
  if (error || !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin routes require admin email match
  if (isAdminRoute(pathname)) {
    const adminEmail = getAdminEmail();
    if (!adminEmail) {
      // If admin email not configured, fail closed
      return NextResponse.redirect(new URL("/", req.url));
    }

    const email = (session.user?.email || "").trim().toLowerCase();
    if (email !== adminEmail) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // ✅ Important: return the `res` so auth cookies refresh properly
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/investor/:path*"],
};