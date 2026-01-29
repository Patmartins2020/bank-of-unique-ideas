// src/app/api/nda/approve/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

/**
 * Safer + less error-prone version:
 * - No `!` non-null assertions at module scope (prevents crash at build/start)
 * - Works whether your column is `email` OR `investor_email`
 * - Validates SITE_URL
 * - Handles Resend failures gracefully (still returns a clear error)
 * - Avoids `any` as much as practical
 */

type Decision = "approved" | "rejected";

function getEnv() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  const EMAIL_FROM =
    process.env.EMAIL_FROM ||
    "Bank of Unique Ideas <no-reply@bankofuniqueideas.com>";

  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000";

  return { SUPABASE_URL, SERVICE_KEY, RESEND_API_KEY, EMAIL_FROM, SITE_URL };
}

function makeSupabaseAdmin(SUPABASE_URL: string, SERVICE_KEY: string) {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

function normalizeSiteUrl(raw: string) {
  // remove trailing slash
  const base = raw.replace(/\/$/, "");
  // basic validation (avoid malformed links)
  if (!/^https?:\/\//i.test(base)) return null;
  return base;
}

export async function POST(req: Request) {
  try {
    const { SUPABASE_URL, SERVICE_KEY, RESEND_API_KEY, EMAIL_FROM, SITE_URL } =
      getEnv();

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables." },
        { status: 500 }
      );
    }

    if (!RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Missing RESEND_API_KEY." },
        { status: 500 }
      );
    }

    const base = normalizeSiteUrl(SITE_URL);
    if (!base) {
      return NextResponse.json(
        {
          error:
            "Invalid SITE_URL / NEXT_PUBLIC_SITE_URL. It must start with http:// or https://",
        },
        { status: 500 }
      );
    }

    // Parse body safely
    const body = await req.json().catch(() => ({} as any));

    const ndaId = typeof body?.ndaId === "string" ? body.ndaId.trim() : "";
    const decision: Decision =
      body?.decision === "rejected" ? "rejected" : "approved";

    const unblurUntilRaw = body?.unblurUntil ?? null;

    if (!ndaId) {
      return NextResponse.json({ error: "Missing ndaId." }, { status: 400 });
    }

    const sb = makeSupabaseAdmin(SUPABASE_URL, SERVICE_KEY);

    // IMPORTANT: support both `email` and `investor_email`
    const { data: nda, error: ndaErr } = await sb
      .from("nda_requests")
      .select("id,status,email,investor_email,idea_id")
      .eq("id", ndaId)
      .maybeSingle();

    if (ndaErr) {
      return NextResponse.json({ error: ndaErr.message }, { status: 500 });
    }
    if (!nda) {
      return NextResponse.json(
        { error: "Invalid NDA request." },
        { status: 404 }
      );
    }

    const investorEmail =
      (nda as any).email ?? (nda as any).investor_email ?? "";

    if (!investorEmail) {
      return NextResponse.json(
        { error: "Missing email on NDA request." },
        { status: 400 }
      );
    }

    // Optional idea title
    let ideaTitle = "Idea";
    const ideaId = (nda as any).idea_id;

    if (ideaId) {
      const { data: ideaRow, error: ideaErr } = await sb
        .from("ideas")
        .select("title")
        .eq("id", ideaId)
        .maybeSingle();

      // If ideas lookup fails, don't crash the whole endpoint
      if (!ideaErr && ideaRow?.title) {
        ideaTitle = ideaRow.title;
      }
    }

    // Update NDA request
    const updatePayload: Record<string, any> = { status: decision };
    updatePayload.unblur_until = decision === "approved" ? unblurUntilRaw : null;

    const { error: updErr } = await sb
      .from("nda_requests")
      .update(updatePayload)
      .eq("id", ndaId);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    // Build link
    const ndaLink = `${base}/nda/${ndaId}`;

    // Email
    const resend = new Resend(RESEND_API_KEY);

    const subject =
      decision === "approved"
        ? `NDA approved | ${ideaTitle}`
        : `NDA rejected | ${ideaTitle}`;

    const html =
      decision === "approved"
        ? `
          <p>Dear Investor,</p>
          <p>Your NDA request for <strong>${ideaTitle}</strong> has been approved.</p>
          <p>Please click the link below to download and sign the NDA, then upload the signed copy:</p>
          <p><a href="${ndaLink}">${ndaLink}</a></p>
          <p>Best regards,<br/>Bank of Unique Ideas</p>
        `
        : `
          <p>Dear Investor,</p>
          <p>Your NDA request for <strong>${ideaTitle}</strong> was rejected.</p>
          <p>Best regards,<br/>Bank of Unique Ideas</p>
        `;

    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: investorEmail,
        subject,
        html,
      });
    } catch (emailErr: any) {
      // DB is already updated; return a clear error so UI can show "email failed"
      return NextResponse.json(
        {
          error: "Email notification failed.",
          details: emailErr?.message || String(emailErr),
          ndaId,
          statusUpdated: true,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, ndaId, decision, emailSentTo: investorEmail },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error." },
      { status: 500 }
    );
  }
}