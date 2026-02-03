// src/app/api/nda/approve/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

type Decision = "approved" | "rejected";

function getEnv() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

  const EMAIL_FROM =
    process.env.EMAIL_FROM ||
    "Bank of Unique Ideas <no-reply@bankofuniqueideas.com>";

  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000";

  return { SUPABASE_URL, SERVICE_KEY, RESEND_API_KEY, EMAIL_FROM, SITE_URL };
}

function normalizeSiteUrl(raw: string) {
  const base = String(raw || "").trim().replace(/\/$/, "");
  if (!/^https?:\/\//i.test(base)) return null;
  return base;
}

function makeSupabaseAdmin(supabaseUrl: string, serviceKey: string) {
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}

export async function POST(req: Request) {
  const startedAt = Date.now();

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
          SITE_URL,
        },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({} as unknown));
    const ndaId =
      typeof (body as any)?.ndaId === "string" ? (body as any).ndaId.trim() : "";

    const decision: Decision =
      (body as any)?.decision === "rejected" ? "rejected" : "approved";

    const unblurUntilRaw = (body as any)?.unblurUntil ?? null;

    if (!ndaId) {
      return NextResponse.json({ error: "Missing ndaId." }, { status: 400 });
    }

    const sb = makeSupabaseAdmin(SUPABASE_URL, SERVICE_KEY);

    const { data: nda, error: ndaErr } = await sb
      .from("nda_requests")
      .select("id,status,email,investor_email,idea_id")
      .eq("id", ndaId)
      .maybeSingle();

    if (ndaErr) return NextResponse.json({ error: ndaErr.message }, { status: 500 });
    if (!nda) return NextResponse.json({ error: "Invalid NDA request." }, { status: 404 });

    const investorEmail =
      (nda as any).email || (nda as any).investor_email || "";

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
      const { data: ideaRow } = await sb
        .from("ideas")
        .select("title")
        .eq("id", ideaId)
        .maybeSingle();
      if (ideaRow?.title) ideaTitle = ideaRow.title;
    }

    // Update DB
    const updatePayload: Record<string, unknown> = {
      status: decision,
      unblur_until: decision === "approved" ? unblurUntilRaw : null,
    };

    const { error: updErr } = await sb
      .from("nda_requests")
      .update(updatePayload)
      .eq("id", ndaId);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    // ✅ CORRECT LINK (STATIC HTML IN /public)
    // Must exist as: /public/nda-access.html
    const ndaLink = `${base}/nda-access.html?ndaId=${encodeURIComponent(ndaId)}`;

    const subject =
      decision === "approved"
        ? `NDA link | ${ideaTitle}`
        : `NDA rejected | ${ideaTitle}`;

    const html =
      decision === "approved"
        ? `
          <p>Dear Investor,</p>
          <p>Please use the link below to download the NDA template and upload your signed copy:</p>
          <p><a href="${ndaLink}">${ndaLink}</a></p>
          <p>Best regards,<br/>Bank of Unique Ideas</p>
        `
        : `
          <p>Dear Investor,</p>
          <p>Your NDA request for <strong>${ideaTitle}</strong> was rejected.</p>
          <p>Best regards,<br/>Bank of Unique Ideas</p>
        `;

    const resend = new Resend(RESEND_API_KEY);

    try {
      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: investorEmail,
        subject,
        html,
      });

      console.log("✅ Resend send result", {
        ndaId,
        to: investorEmail,
        result: safeJson(result),
        durationMs: Date.now() - startedAt,
      });

      return NextResponse.json(
        { ok: true, ndaId, decision, emailSentTo: investorEmail, ndaLink },
        { status: 200 }
      );
    } catch (emailErr: any) {
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
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error." },
      { status: 500 }
    );
  }
}
