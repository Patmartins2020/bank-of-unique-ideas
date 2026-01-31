// src/app/api/nda/approve/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

/**
 * Hardened production-safe handler:
 * - No non-null (!) env assertions at module scope (prevents build/runtime crash)
 * - Validates env + SITE_URL
 * - Supports `email` OR `investor_email`
 * - Updates DB first, then attempts email
 * - Logs useful details to Vercel logs (without leaking secrets)
 * - Returns structured error payload UI can display
 * - Uses /nda-access/[ndaId] link (matches your folder)
 */

type Decision = "approved" | "rejected";

function getEnv() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

  const EMAIL_FROM =
    process.env.EMAIL_FROM ||
    "Bank of Unique Ideas <no-reply@bankofuniqueideas.com>";

  // Use ONE canonical variable for base URL (set this in Vercel)
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

    // 1) Validate env
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error("❌ Missing Supabase env vars", {
        hasSupabaseUrl: Boolean(SUPABASE_URL),
        hasServiceKey: Boolean(SERVICE_KEY),
      });
      return NextResponse.json(
        { error: "Missing Supabase environment variables." },
        { status: 500 }
      );
    }

    if (!RESEND_API_KEY) {
      console.error("❌ Missing RESEND_API_KEY");
      return NextResponse.json(
        { error: "Missing RESEND_API_KEY." },
        { status: 500 }
      );
    }

    const base = normalizeSiteUrl(SITE_URL);
    if (!base) {
      console.error("❌ Invalid SITE_URL / NEXT_PUBLIC_SITE_URL", { SITE_URL });
      return NextResponse.json(
        {
          error:
            "Invalid SITE_URL / NEXT_PUBLIC_SITE_URL. It must start with http:// or https://",
          SITE_URL,
        },
        { status: 500 }
      );
    }

    // 2) Parse body safely
    const body = await req.json().catch(() => ({} as unknown));

    const ndaId =
      typeof (body as any)?.ndaId === "string" ? (body as any).ndaId.trim() : "";

    const decision: Decision =
      (body as any)?.decision === "rejected" ? "rejected" : "approved";

    const unblurUntilRaw = (body as any)?.unblurUntil ?? null;

    if (!ndaId) {
      return NextResponse.json({ error: "Missing ndaId." }, { status: 400 });
    }

    console.log("➡️ NDA approve request received", {
      ndaId,
      decision,
      hasUnblurUntil: unblurUntilRaw != null,
    });

    // 3) Load NDA from DB
    const sb = makeSupabaseAdmin(SUPABASE_URL, SERVICE_KEY);

    const { data: nda, error: ndaErr } = await sb
      .from("nda_requests")
      .select("id,status,email,investor_email,idea_id")
      .eq("id", ndaId)
      .maybeSingle();

    if (ndaErr) {
      console.error("❌ Supabase read error", ndaErr);
      return NextResponse.json({ error: ndaErr.message }, { status: 500 });
    }

    if (!nda) {
      return NextResponse.json({ error: "Invalid NDA request." }, { status: 404 });
    }

    const investorEmail =
      (nda as any).email || (nda as any).investor_email || "";

    if (!investorEmail) {
      return NextResponse.json(
        { error: "Missing email on NDA request." },
        { status: 400 }
      );
    }

    // 4) Optional idea title (non-fatal if missing)
    let ideaTitle = "Idea";
    const ideaId = (nda as any).idea_id;

    if (ideaId) {
      const { data: ideaRow, error: ideaErr } = await sb
        .from("ideas")
        .select("title")
        .eq("id", ideaId)
        .maybeSingle();

      if (ideaErr) {
        console.warn("⚠️ Ideas lookup failed (non-fatal)", ideaErr.message);
      } else if (ideaRow?.title) {
        ideaTitle = ideaRow.title;
      }
    }

    // 5) Update DB status
    const updatePayload: Record<string, unknown> = {
      status: decision,
      unblur_until: decision === "approved" ? unblurUntilRaw : null,
    };

    const { error: updErr } = await sb
      .from("nda_requests")
      .update(updatePayload)
      .eq("id", ndaId);

    if (updErr) {
      console.error("❌ Supabase update error", updErr);
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    // 6) Build link (IMPORTANT: matches your folder /nda-access/[ndaId])
    const ndaLink = `${base}/nda-access/${encodeURIComponent(ndaId)}`;

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

    // 7) Send email
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
      console.error("❌ Resend send failed", {
        ndaId,
        to: investorEmail,
        message: emailErr?.message || String(emailErr),
        raw: safeJson(emailErr),
        durationMs: Date.now() - startedAt,
      });

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
    console.error("❌ NDA APPROVE API FATAL", {
      message: err?.message || String(err),
      raw: safeJson(err),
    });

    return NextResponse.json(
      { error: err?.message || "Server error." },
      { status: 500 }
    );
  }
}
