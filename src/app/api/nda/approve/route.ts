import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@bankofuniqueideas.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bankofuniqueideas.com";

function supabaseAdmin() {
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const ndaId = String(body.ndaId || "");
    const decision = (body.decision as "approved" | "rejected") || "approved";

    if (!ndaId) {
      return NextResponse.json({ error: "Missing ndaId." }, { status: 400 });
    }
    if (!["approved", "rejected"].includes(decision)) {
      return NextResponse.json({ error: "Invalid decision value." }, { status: 400 });
    }

    const sb = supabaseAdmin();

    const { data: nda, error: ndaErr } = await sb
      .from("nda_requests")
      .select("id,status,investor_email,idea_title")
      .eq("id", ndaId)
      .maybeSingle();

    if (ndaErr) return NextResponse.json({ error: ndaErr.message }, { status: 500 });
    if (!nda) return NextResponse.json({ error: "Invalid NDA request." }, { status: 404 });

    if (!nda.investor_email) {
      return NextResponse.json({ error: "Missing investor_email on NDA request." }, { status: 400 });
    }

    // Update status
    const updatePayload: any = {
      status: decision,
    };
    if (decision === "approved") updatePayload.approved_at = new Date().toISOString();

    const { error: updErr } = await sb.from("nda_requests").update(updatePayload).eq("id", ndaId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    // Email
    const resend = new Resend(RESEND_API_KEY);

    const ideaTitle = nda.idea_title || "Idea";
    const ndaLink = `${SITE_URL.replace(/\/$/, "")}/nda/${ndaId}`;

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
      to: nda.investor_email,
      subject,
      html,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error." }, { status: 500 });
  }
}