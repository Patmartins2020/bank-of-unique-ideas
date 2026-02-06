import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* -------------------------------------------------- */
/* Helpers                                            */
/* -------------------------------------------------- */

function getBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000";

  return raw.replace(/\/$/, "");
}

function getEnv() {
  return {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
    EMAIL_FROM:
      process.env.EMAIL_FROM ??
      "Bank of Unique Ideas <no-reply@bankofuniqueideas.com>",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? "",
  };
}

/* -------------------------------------------------- */
/* POST handler                                       */
/* -------------------------------------------------- */

export async function POST(req: Request) {
  try {
    const {
      SUPABASE_URL,
      SERVICE_KEY,
      RESEND_API_KEY,
      EMAIL_FROM,
      ADMIN_EMAIL,
    } = getEnv();

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    /* ✅ CORRECT WAY (NO context, NO req.cookies) */
    const supabase = createRouteHandlerClient({
      cookies,
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const email = user.email;
    if (!email) {
      return NextResponse.json(
        { error: "User email missing" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const ideaId = typeof body.ideaId === "string" ? body.ideaId : null;

    if (!ideaId) {
      return NextResponse.json(
        { error: "Missing ideaId" },
        { status: 400 }
      );
    }

    /* Admin client (bypass RLS) */
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    /* Check idea */
    const { data: idea, error: ideaErr } = await admin
      .from("ideas")
      .select("id,title,protected")
      .eq("id", ideaId)
      .single();

    if (ideaErr || !idea) {
      return NextResponse.json(
        { error: "Idea not found" },
        { status: 404 }
      );
    }

    if (!idea.protected) {
      return NextResponse.json(
        { ok: true, message: "NDA not required" },
        { status: 200 }
      );
    }

    /* Existing request? */
    const { data: existing } = await admin
      .from("nda_requests")
      .select("id,status")
      .eq("idea_id", ideaId)
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let ndaId = existing?.id;

    if (!ndaId) {
      const { data: created, error: createErr } = await admin
        .from("nda_requests")
        .insert({
          idea_id: ideaId,
          email,
          status: "requested",
        })
        .select("id")
        .single();

      if (createErr) {
        return NextResponse.json(
          { error: createErr.message },
          { status: 500 }
        );
      }

      ndaId = created.id;
    }

    /* Email admin (optional) */
    if (ADMIN_EMAIL && RESEND_API_KEY) {
      try {
        const resend = new Resend(RESEND_API_KEY);
        const base = getBaseUrl();

        await resend.emails.send({
          from: EMAIL_FROM,
          to: ADMIN_EMAIL,
          subject: `New NDA Request – ${idea.title ?? "Idea"}`,
          html: `
            <p>An investor requested NDA access.</p>
            <p><strong>Idea:</strong> ${idea.title ?? "Untitled"}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><a href="${base}/admin">Open Admin Dashboard</a></p>
            <p>NDA ID: ${ndaId}</p>
          `,
        });
      } catch {
        /* email failure does not block request */
      }
    }

    return NextResponse.json(
      {
        ok: true,
        ndaId,
        message: "NDA request submitted",
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}