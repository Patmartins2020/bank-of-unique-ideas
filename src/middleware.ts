// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

function isAdminRoute(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/dashboard");
}

function isInvestorRoute(pathname: string) {
  return pathname.startsWith("/investor");
}

function isAuthRoute(pathname: string) {
  return pathname.startsWith("/login") || pathname.startsWith("/signup");
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ✅ Skip static + API
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$/)
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isProtected =
    isAdminRoute(pathname) || isInvestorRoute(pathname);

  // ✅ If NOT logged in and trying to access protected route
  if (!session && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ✅ Prevent logged-in users from going back to login/signup
  if (session && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // ✅ Admin check
  if (session && isAdminRoute(pathname)) {
    const adminEmail =
      (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();

    const userEmail = session.user.email?.toLowerCase();

    if (adminEmail && userEmail !== adminEmail) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/investor/:path*",
    "/login",
    "/signup",
  ],
};