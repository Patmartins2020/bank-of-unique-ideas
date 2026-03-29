import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;

  // ✅ NEVER touch these routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return res;
  }

  // ✅ NEVER redirect login or signup (prevents loops)
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return res;
  }

  // ✅ Protect ONLY these routes
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/investor");

  // 🔐 If not logged in → go to login
  if (!session && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/investor/:path*",
  ],
};