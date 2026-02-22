// src/app/api/nda/approve/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// what admin buttons send
type Action = "send_nda_link" | "reject_request" | "approve_signed";

// stages derived from action
type Stage = "request" | "signed";

// IMPORTANT: these must match your DB constraint values
type DbStatus = "pending" | "approved" | "rejected" | "signed" | "verified";

function jsonError(message: string, status = 400, details?: any) {
  return NextResponse.json(
    { ok: false, error: message, ...(details ? { details } : {}) },
    { status }
  );
}

function mustBaseUrl(url: string) {
  const cleaned = (url || "").trim().replace(/\/$/, "");
  if (!/^https?:\/\//i.test(cleaned)) return null;
  return cleaned;
}

function adminClient(url: string, key: string) {
  return createClient(url, key, { auth: { persistSession: false } });
}

function parseAction(raw: any): { ndaId: string; action: Action; stage: Stage } {
  const ndaId = typeof raw?.ndaId === "string" ? raw.ndaId.trim() : "";
  const action = raw?.action as Action;

  if (!action || !["send_nda_link", "reject_request", "approve_signed"].includes(action)) {
    // fallback (older payloads)
    return { ndaId, action: "send_nda_link", stage: "request" };
  }

  const stage: Stage = action === "approve_signed" ? "signed" : "request";
  return { ndaId, action, stage };
}

async function safeSendEmail(resend: Resend | null, payload: any) {
  if (!resend) return { emailSent: false, emailError: "RESEND_API_KEY missing" };
  try {
    await resend.emails.send(payload);
    return { emailSent: true, emailError: null };
  } catch (e: any) {
    return { emailSent: false, emailError: e?.message || String(e) };
  }
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const RESEND_API_KEY = (process.env.RESEND_API_KEY || "").trim();

    const EMAIL_FROM =
      process.env.EMAIL_FROM || "Bank of Unique Ideas <no-reply@bankofuniqueideas.com>";

    const SITE_URL = mustBaseUrl(
      (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000").trim()
    );

    if (!SUPABASE_URL || !SERVICE_KEY) return jsonError("Missing Supabase env vars.", 500);
    if (!SITE_URL) {
      return jsonError(
        "Invalid SITE_URL / NEXT_PUBLIC_SITE_URL (must start with http:// or https://)",
        500
      );
    }

    const body = await req.json().catch(() => ({} as any));
    const { ndaId, action, stage } = parseAction(body);
    if (!ndaId) return jsonError("Missing ndaId.", 400);

    const sb = adminClient(SUPABASE_URL, SERVICE_KEY);

    const { data: nda, error: ndaErr } = await sb
      .from("nda_requests")
      .select(
        "id,status,email,investor_email,idea_id,signed_nda_url,signed_nda_path,signed_file_path,unblur_until"
      )
      .eq("id", ndaId)
      .maybeSingle();

    if (ndaErr) return jsonError("DB read failed.", 500, ndaErr.message);
    if (!nda) return jsonError("Invalid NDA request.", 404);

    const investorEmail = (nda as any).email || (nda as any).investor_email || "";
    if (!investorEmail) return jsonError("Missing investor email on NDA request.", 400);

    const ideaId = (nda as any).idea_id || null;

    // Optional: idea title (single query only)
    let ideaTitle = "Idea";
    if (ideaId) {
      const { data: ideaRow } = await sb.from("ideas").select("title").eq("id", ideaId).maybeSingle();
      if (ideaRow?.title) ideaTitle = ideaRow.title;
    }

    const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

    // ---------------------------------------------------------
    // STAGE 1: ADMIN acts on REQUEST (Send NDA link or Reject)
    // ---------------------------------------------------------
    if (stage === "request") {
      // Only these two actions are valid at request stage
      if (action !== "send_nda_link" && action !== "reject_request") {
        return jsonError("Invalid action for request stage.", 400, { action });
      }

      const newStatus: DbStatus = action === "send_nda_link" ? "approved" : "rejected";

      const { error: updErr } = await sb.from("nda_requests").update({ status: newStatus }).eq("id", ndaId);
      if (updErr) return jsonError("DB update failed.", 500, updErr.message);

      if (action === "send_nda_link") {
        const uploadLink = `${SITE_URL}/nda-access.html?ndaId=${encodeURIComponent(ndaId)}`;

        const emailRes = await safeSendEmail(resend, {
          from: EMAIL_FROM,
          to: investorEmail,
          subject: `NDA upload link | ${ideaTitle}`,
          html: `
            <p>Dear Investor,</p>
            <p>Your NDA request for <strong>${ideaTitle}</strong> was approved.</p>
            <p>Please use the link below to download the NDA template and upload your signed copy:</p>
            <p><a href="${uploadLink}">${uploadLink}</a></p>
            <p>Best regards,<br/>Bank of Unique Ideas</p>
          `,
        });

        return NextResponse.json({
          ok: true,
          ndaId,
          action,
          stage,
          status: newStatus,
          uploadLink,
          ...emailRes,
        });
      }

      // reject_request
      const emailRes = await safeSendEmail(resend, {
        from: EMAIL_FROM,
        to: investorEmail,
        subject: `NDA request rejected | ${ideaTitle}`,
        html: `
          <p>Dear Investor,</p>
          <p>Your NDA request for <strong>${ideaTitle}</strong> was rejected.</p>
          <p>Best regards,<br/>Bank of Unique Ideas</p>
        `,
      });

      return NextResponse.json({
        ok: true,
        ndaId,
        action,
        stage,
        status: newStatus,
        ...emailRes,
      });
    }

    // ---------------------------------------------------------
    // STAGE 2: ADMIN approves SIGNED NDA (grant 48h access)
    // ---------------------------------------------------------
    if (stage === "signed") {
      if (action !== "approve_signed") {
        return jsonError("Invalid action for signed stage.", 400, { action });
      }

      if (!ideaId) return jsonError("Missing idea_id on NDA request.", 400);

      const hasSigned =
        Boolean((nda as any).signed_nda_url) ||
        Boolean((nda as any).signed_nda_path) ||
        Boolean((nda as any).signed_file_path);

      if (!hasSigned) {
        return jsonError("Cannot approve signed NDA: no signed NDA uploaded yet.", 400);
      }

      const newStatus: DbStatus = "verified";
      const unblurUntil = new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString();

      const { error: updErr } = await sb
        .from("nda_requests")
        .update({
          status: newStatus,
          unblur_until: unblurUntil,
          idea_access_granted_at: new Date().toISOString(),
        })
        .eq("id", ndaId);

      if (updErr) return jsonError("DB update failed.", 500, updErr.message);

      const unlockLink = `${SITE_URL}/investor/ideas/${encodeURIComponent(ideaId)}?ndaId=${encodeURIComponent(
        ndaId
      )}`;

const emailRes = await safeSendEmail(resend, {
  from: EMAIL_FROM,
  to: investorEmail,
  subject: `Access granted | ${ideaTitle}`,
  html: `
    <p>Dear Investor,</p>
    <p>Your signed NDA was reviewed and approved.</p>
    <p>You can now access the protected idea using this link:</p>
    <p><a href="${unlockLink}">${unlockLink}</a></p>
    <p><strong>Note:</strong> access expires on ${new Date(unblurUntil).toLocaleString()}.</p>
    <p>Best regards,<br/>Bank of Unique Ideas</p>
  `,
});

return NextResponse.json({
  ok: true,
  ndaId,
  action,
  stage,
  status: newStatus,
  unlockLink,
  ...emailRes,
});
    }

    return jsonError("Invalid stage.", 400);
  } catch (e: any) {
    console.error("[API] /api/nda/approve error:", e);
    return jsonError("Server error.", 500, e?.message || String(e));
  }
}