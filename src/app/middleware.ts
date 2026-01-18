import { NextResponse, type NextRequest } from "next/server";
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
    console.warn(
      "[middleware] ADMIN_EMAIL not set; redirecting non-guarded users to /"
    );
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!haveSupabaseEnv()) {
    console.warn("[middleware] Supabase env missing; redirecting to /login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const supabase = createMiddlewareClient({ req, res });

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("[middleware] getSession error:", error);
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const email = (session.user?.email || "").toLowerCase();
    if (email !== adminEmail) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return res;
  } catch (err) {
    console.error("[middleware] unexpected error:", err);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};