import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NDAStatus = "requested" | "pending" | "approved" | "rejected" | "signed" | "verified";
type NDAAdminAction = "send_nda_link" | "reject_request" | "approve_signed";

function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra ? extra : {}) },
    { status }
  );
}

const ACTION_MAP: Record<
  NDAAdminAction,
  { status: NDAStatus; message: string; sendEmail: boolean }
> = {
  send_nda_link: {
    status: "pending",
    message: "NDA link sent to investor.",
    sendEmail: true,
  },
  reject_request: {
    status: "rejected",
    message: "Request rejected.",
    sendEmail: true,
  },
  approve_signed: {
    status: "approved",
    message: "Approved. Investor now has access.",
    sendEmail: true,
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const ndaId = body?.ndaId as string | undefined;
    const action = body?.action as NDAAdminAction | undefined;

    if (!ndaId) return jsonError("Missing ndaId", 400);
    if (!action || !(action in ACTION_MAP)) return jsonError("Invalid action", 400);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supabaseUrl || !serviceKey) return jsonError("Missing Supabase env vars", 500);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 1) Load row (needed for email + UI return)
    const { data: row, error: rowErr } = await admin
      .from("nda_requests")
      .select("*")
      .eq("id", ndaId)
      .maybeSingle();

    if (rowErr || !row) return jsonError("NDA row not found", 404);

    // 2) Update status (must match DB check constraint)
    const nextStatus = ACTION_MAP[action].status;

    const { data: updated, error: updErr } = await admin
      .from("nda_requests")
      .update({ status: nextStatus })
      .eq("id", ndaId)
      .select("*")
      .maybeSingle();

    if (updErr || !updated) {
      return jsonError("Failed to update NDA status", 500, { details: updErr?.message });
    }

    // 3) Optional email
    let emailSent = false;
    if (ACTION_MAP[action].sendEmail && updated.email) {
      // Call your email API (one place)
      const emailRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/nda/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          investorEmail: updated.email,
          investorName: updated.investor_name,
          ideaTitle: updated.idea_title,
          ndaId: updated.id,
        }),
      }).catch(() => null);

      emailSent = !!emailRes && (emailRes as Response).ok;
    }

    return NextResponse.json({
      ok: true,
      message: ACTION_MAP[action].message,
      emailSent,
      row: {
        id: updated.id,
        status: updated.status,
        signed_nda_url: updated.signed_nda_url ?? null,
        access_until: updated.access_until ?? null,
      },
    });
  } catch (e: any) {
    return jsonError("Internal server error", 500, {
      details: e?.message || String(e),
    });
  }
}