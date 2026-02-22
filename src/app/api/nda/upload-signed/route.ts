// src/app/api/nda/upload-signed/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400, details?: any) {
  return NextResponse.json({ ok: false, error: message, details }, { status });
}

function getEnv() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const BUCKET = process.env.NDA_SIGNED_BUCKET?.trim() || "signed-ndas";
  return { SUPABASE_URL, SERVICE_KEY, BUCKET };
}

function adminClient(url: string, key: string) {
  return createClient(url, key, { auth: { persistSession: false } });
}

function safeFileName(name: string) {
  return (name || "signed-nda.pdf").replace(/[^\w.\-]/g, "_");
}

export async function POST(req: Request) {
  try {
    const { SUPABASE_URL, SERVICE_KEY, BUCKET } = getEnv();

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return jsonError("Missing Supabase env vars.", 500, {
        hasUrl: !!SUPABASE_URL,
        hasServiceKey: !!SERVICE_KEY,
      });
    }

    const sb = adminClient(SUPABASE_URL, SERVICE_KEY);

    const form = await req.formData();

    // ✅ Accept either ndaId or requestId so your HTML won’t break
    const ndaId =
      String(form.get("ndaId") || "").trim() ||
      String(form.get("requestId") || "").trim();

    const file = form.get("file");

    if (!ndaId) return jsonError("Missing ndaId/requestId.", 400);
    if (!(file instanceof File)) return jsonError("Missing file.", 400);

    // Validate file
    const maxBytes = 10 * 1024 * 1024;
    const allowed = ["application/pdf", "image/png", "image/jpeg"];

    if (!allowed.includes(file.type)) {
      return jsonError("Only PDF, PNG, or JPG files are allowed.", 400, {
        got: file.type,
      });
    }
    if (file.size > maxBytes) {
      return jsonError("File too large (max 10MB).", 400, { size: file.size });
    }

    // Load NDA request
    const { data: nda, error: ndaErr } = await sb
      .from("nda_requests")
      .select("id,status,signed_nda_path,signed_file_path")
      .eq("id", ndaId)
      .maybeSingle();

    if (ndaErr) return jsonError("DB read failed.", 500, ndaErr.message);
    if (!nda) return jsonError("Invalid or expired NDA request.", 404);

    const status = String((nda as any).status || "").toLowerCase();

    // ✅ Upload allowed ONLY after admin confirmed request
    if (status !== "approved") {
      return jsonError(
        "NDA upload not allowed yet. Admin must confirm the request first.",
        403,
        { status }
      );
    }

    // Block duplicates
    if ((nda as any).signed_nda_path || (nda as any).signed_file_path) {
      return jsonError("Signed NDA already uploaded.", 409);
    }

    // Upload to bucket
    const name = safeFileName(file.name);
    const path = `${ndaId}/${Date.now()}_${name}`;

    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: upErr } = await sb.storage.from(BUCKET).upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });

    if (upErr) return jsonError("Storage upload failed.", 500, upErr.message);

    // ✅ Update the exact columns your admin dashboard is checking
    const { error: updErr } = await sb
      .from("nda_requests")
      .update({
        status: "signed",
        signed_nda_path: path,
        signed_file_path: path,
        signed_at: new Date().toISOString(), // use this because it already appears in your codebase
      })
      .eq("id", ndaId);

    if (updErr) return jsonError("DB update failed.", 500, updErr.message);

    return NextResponse.json({ ok: true, ndaId, path }, { status: 200 });
  } catch (e: any) {
    return jsonError("Server error.", 500, e?.message || String(e));
  }
}