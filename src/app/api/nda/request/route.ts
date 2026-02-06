import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------------------------------- */
/* Helpers                            */
/* ---------------------------------- */

function getBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000";

  const base = String(raw).trim().replace(/\/$/, "");
  if (!/^https?:\/\//i.test(base)) return "http://localhost:3000";
  return base;
}

function getEnv() {
  return {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    RESEND_API_KEY: process.env.RESEND_API_KEY || "",
    EMAIL_FROM:
      process.env.EMAIL_FROM ||
      "Bank of Unique Ideas <no-reply@bankofuniqueideas.com>",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "",
  };
}

/* ---------------------------------- */
/* POST                               */
/* ---------------------------------- */

export async function POST(req: Request) {
  try {
    const {
      SUPABASE_URL,
      SERVICE_KEY,
      RESEND_API_KEY,
      EMAIL_FROM,
      ADMIN_EMAIL,
    } = getEnv();

    if (!SUPABASE_URL) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL" },
        { status: 500 }
      );
    }

    /* -------------------------------
       Investor-authenticated client
    -------------------------------- */
    const supabase = createRouteHandlerClient({
      cookies: () => cookies(),
    });

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "User email missing" },
        { status: 400 }
      );
    }

    const { ideaId } = await req.json().catch(() => ({}));

    if (!ideaId || typeof ideaId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid ideaId" },
        { status: 400 }
      );
    }

    /* -------------------------------
       Admin (service role) client
    -------------------------------- */
    if (!SERVICE_KEY) {
      return NextResponse.json(
        { error: "Missing SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const sbAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    /* -------------------------------
       Validate idea
    -------------------------------- */
    const { data: idea, error: ideaErr } = await sbAdmin
      .from("ideas")
      .select("id,title,protected")
      .eq("id", ideaId)
      .maybeSingle();

    if (ideaErr) {
      return NextResponse.json(
        { error: ideaErr.message },
        { status: 500 }
      );
    }

    if (!idea) {
      return NextResponse.json(
        { error: "Idea not found" },
        { status: 404 }
      );
    }

    if (!idea.protected) {
      return NextResponse.json(
        { ok: true, message: "This idea does not require NDA." },
        { status: 200 }
      );
    }

    /* -------------------------------
       Check existing NDA request
    -------------------------------- */
    const { data: existing, error: existErr } = await sbAdmin
      .from("nda_requests")
      .select("id,status,created_at")
      .eq("idea_id", ideaId)
      .eq("email", user.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existErr) {
      return NextResponse.json(
        { error: existErr.message },
        { status: 500 }
      );
    }

    let ndaId = existing?.id;
    let status = existing?.status ?? "requested";

    if (!ndaId) {
      const { data: created, error: createErr } = await sbAdmin
        .from("nda_requests")
        .insert({
          idea_id: ideaId,
          email: user.email,
          status: "requested",
        })
        .select("id,status")
        .maybeSingle();

      if (createErr) {
        return NextResponse.json(
          { error: createErr.message },
          { status: 500 }
        );
      }

      ndaId = created?.id;
      status = created?.status ?? "requested";
    }

    /* -------------------------------
       Notify admin (optional)
    -------------------------------- */
    if (ADMIN_EMAIL && RESEND_API_KEY) {
      const resend = new Resend(RESEND_API_KEY);
      const base = getBaseUrl();
      const adminUrl = `${base}/admin`;

      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: ADMIN_EMAIL,
          subject: `New NDA request | ${idea.title ?? "Idea"}`,
          html: `
            <p>Hello Admin,</p>
            <p>An investor requested NDA access for:</p>
            <p><strong>${idea.title ?? "Idea"}</strong></p>
            <p><strong>Investor:</strong> ${user.email}</p>
            <p>
              <a href="${adminUrl}">Open Admin Dashboard</a>
            </p>
            <p><small>NDA ID: ${ndaId}</small></p>
          `,
        });
      } catch {
        // Email failure should NOT break flow
      }
    }

    /* -------------------------------
       Success
    -------------------------------- */
    return NextResponse.json(
      {
        ok: true,
        ndaId,
        status,
        message: "NDA request sent. Please wait for admin approval.",
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}