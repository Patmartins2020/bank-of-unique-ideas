// middleware.ts (project root, same folder as package.json)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

function haveSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Only protect /dashboard routes
  if (!req.nextUrl.pathname.startsWith("/dashboard")) return res;

  const adminEmail = (
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    ""
  ).toLowerCase();

  if (!adminEmail) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!haveSupabaseEnv()) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const email = (session.user?.email || "").toLowerCase();
  if (email !== adminEmail) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};