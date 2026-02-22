// src/app/api/nda/access/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  // Always redirect to the ideas page
  const redirectUrl = new URL("/investor/ideas", req.url);

  // If token is missing, just redirect without cookie
  if (!token || token === "undefined") {
    return NextResponse.redirect(redirectUrl);
  }

  // ✅ Set cookie on the RESPONSE (best practice for route handlers)
  const res = NextResponse.redirect(redirectUrl);

  res.cookies.set("nda_access", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}