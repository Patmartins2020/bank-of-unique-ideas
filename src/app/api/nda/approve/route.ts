import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const EMAIL_FROM =
  process.env.EMAIL_FROM || "Bank of Unique Ideas <no-reply@bankofuniqueideas.com>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000";

function supabaseAdmin() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

export async function POST(req: Request) {
  try {
    // 1) Validate env (this prevents silent crashes)
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

    // 2) Parse body
    const body = await req.json().catch(() => ({}));
    const ndaId = String(body.ndaId || "");
    const decision = (body.decision as "approved" | "rejected") || "approved";
    const unblurUntilRaw = body.unblurUntil ?? null;

    if (!ndaId) {
      return NextResponse.json({ error: "Missing ndaId." }, { status: 400 });
    }
    if (!["approved", "rejected"].includes(decision)) {
      return NextResponse.json({ error: "Invalid decision value." }, { status: 400 });
    }

    const sb = supabaseAdmin();

    // 3) Load NDA request from DB (use YOUR actual columns)
    // Adjust these column names only if your table differs.
    const { data: nda, error: ndaErr } = await sb
      .from("nda_requests")
      .select("id, status, email, idea_id")
      .eq("id", ndaId)
      .maybeSingle();

    if (ndaErr) return NextResponse.json({ error: ndaErr.message }, { status: 500 });
    if (!nda) return NextResponse.json({ error: "Invalid NDA request." }, { status: 404 });

    if (!nda.email) {
      return NextResponse.json({ error: "Missing email on NDA request." }, { status: 400 });
    }

    // 4) Get idea title (optional, but nice for email subject)
    let ideaTitle = "Idea";
    if (nda.idea_id) {
      const { data: ideaRow } = await sb
        .from("ideas")
        .select("title")
        .eq("id", nda.idea_id)
        .maybeSingle();
      if (ideaRow?.title) ideaTitle = ideaRow.title;
    }

    // 5) Update NDA status + unblur_until (matches your frontend logic)
    const updatePayload: any = { status: decision };

    // keep your 7-day access logic controlled by frontend,
    // but store it here if supplied.
    if (decision === "approved") {
      updatePayload.unblur_until = unblurUntilRaw;
    } else {
      updatePayload.unblur_until = null;
    }

    const { error: updErr } = await sb
      .from("nda_requests")
      .update(updatePayload)
      .eq("id", ndaId);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    // 6) Build NDA link
    const base = SITE_URL.replace(/\/$/, "");
    const ndaLink = `${base}/nda/${ndaId}`;

    // 7) Send email via Resend
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

    await resend.emails.send({
      from: EMAIL_FROM,
      to: nda.email,
      subject,
      html,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error." },
      { status: 500 }
    );
  }
}