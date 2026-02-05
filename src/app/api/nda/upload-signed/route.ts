import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function env() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
  const EMAIL_FROM =
    process.env.EMAIL_FROM ||
    "Bank of Unique Ideas <no-reply@bankofuniqueideas.com>";

  const SITE_URL =
    (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "")
      .trim()
      .replace(/\/$/, "");

  return { SUPABASE_URL, SERVICE_KEY, RESEND_API_KEY, EMAIL_FROM, SITE_URL };
}

function mustBaseUrl(url: string) {
  if (!/^https?:\/\//i.test(url)) throw new Error("Invalid SITE_URL (must start with http/https).");
  return url;
}

export async function POST(req: Request) {
  try {
    const { SUPABASE_URL, SERVICE_KEY, RESEND_API_KEY, EMAIL_FROM, SITE_URL } = env();
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: "Missing Supabase env vars." }, { status: 500 });
    }
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: "Missing RESEND_API_KEY." }, { status: 500 });
    }
    const base = mustBaseUrl(SITE_URL);

    // Expect multipart/form-data: ndaId + file
    const form = await req.formData();
    const ndaId = String(form.get("ndaId") || "").trim();
    const file = form.get("file") as File | null;

    if (!ndaId) return NextResponse.json({ error: "Missing ndaId." }, { status: 400 });
    if (!file) return NextResponse.json({ error: "Missing file." }, { status: 400 });

    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // Validate NDA request
    const { data: nda, error: ndaErr } = await sb
      .from("nda_requests")
      .select("id,status,email,investor_email,idea_id")
      .eq("id", ndaId)
      .maybeSingle();

    if (ndaErr) return NextResponse.json({ error: ndaErr.message }, { status: 500 });
    if (!nda) return NextResponse.json({ error: "Invalid NDA request." }, { status: 404 });

    if (nda.status !== "approved") {
      return NextResponse.json({ error: "NDA is not approved yet." }, { status: 400 });
    }

    const investorEmail = (nda as any).email || (nda as any).investor_email;
    const ideaId = (nda as any).idea_id;

    if (!investorEmail) return NextResponse.json({ error: "Missing investor email." }, { status: 400 });
    if (!ideaId) return NextResponse.json({ error: "Missing idea_id on NDA request." }, { status: 400 });

    // Upload file to Storage (private bucket)
    const safeName = (file.name || "signed-nda.pdf").replace(/[^\w.\-]/g, "_");
    const path = `${ndaId}/${Date.now()}_${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: upErr } = await sb.storage
      .from("nda-signed")
      .upload(path, arrayBuffer, {
        contentType: file.type || "application/pdf",
        upsert: true,
      });

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    // ✅ AUTO-UNLOCK: set verified + unblur window
    const unblurUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(); // 30 days

    const { error: updErr } = await sb
      .from("nda_requests")
      .update({
        status: "verified",
        signed_file_path: path,
        unblur_until: unblurUntil,
      })
      .eq("id", ndaId);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    // Send the unlock link (2nd email)
    const unlockLink = `${base}/investor/ideas/${encodeURIComponent(ideaId)}?ndaId=${encodeURIComponent(ndaId)}`;

    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from: EMAIL_FROM,
      to: investorEmail,
      subject: "Access link unlocked | Bank of Unique Ideas",
      html: `
        <p>Dear Investor,</p>
        <p>Your signed NDA was received successfully.</p>
        <p>You can now access the protected idea using this link:</p>
        <p><a href="${unlockLink}">${unlockLink}</a></p>
        <p><strong>Note:</strong> access expires on ${new Date(unblurUntil).toLocaleString()}.</p>
        <p>Best regards,<br/>Bank of Unique Ideas</p>
      `,
    });

    return NextResponse.json({ ok: true, ndaId, ideaId, unlockLink }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error." }, { status: 500 });
  }
}