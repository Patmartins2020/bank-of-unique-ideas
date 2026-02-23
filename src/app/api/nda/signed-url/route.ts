import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400, details?: any) {
  return NextResponse.json(
    { ok: false, error: message, ...(details ? { details } : {}) },
    { status }
  );
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const ndaId = (url.searchParams.get("ndaId") || "").trim();
    if (!ndaId) return jsonError("Missing ndaId.", 400);

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!SUPABASE_URL || !SERVICE_KEY) return jsonError("Missing Supabase env vars.", 500);

    const SIGNED_BUCKET = (process.env.SIGNED_NDA_BUCKET || "signed-ndas").trim();

    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const { data: nda, error: ndaErr } = await sb
      .from("nda_requests")
      .select("id, signed_nda_url, signed_nda_path, signed_file_path")
      .eq("id", ndaId)
      .maybeSingle();

    if (ndaErr) return jsonError("DB read failed.", 500, ndaErr.message);
    if (!nda) return jsonError("NDA request not found.", 404);

    // If you already store a full URL, return it
    const directUrl = (nda as any).signed_nda_url as string | null;
    if (directUrl) return NextResponse.json({ ok: true, url: directUrl });

    // Otherwise use the stored path
    const path =
      ((nda as any).signed_nda_path as string | null) ||
      ((nda as any).signed_file_path as string | null);

    if (!path) return jsonError("No signed NDA uploaded yet.", 400);

    // Generate a short-lived signed URL (10 minutes)
    const { data: signed, error: signErr } = await sb.storage
      .from(SIGNED_BUCKET)
      .createSignedUrl(path, 60 * 10);

    if (signErr) return jsonError("Failed to create signed URL.", 500, signErr.message);

    return NextResponse.json({ ok: true, url: signed?.signedUrl });
  } catch (e: any) {
    return jsonError("Server error.", 500, e?.message || String(e));
  }
}