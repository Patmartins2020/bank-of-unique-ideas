// src/app/api/nda/access/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  if (!token || token === "undefined") {
    return NextResponse.redirect(new URL("/investor/ideas", req.url));
  }

  const cookieStore = await cookies();
  cookieStore.set("nda_access", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.redirect(new URL("/investor/ideas", req.url));
}