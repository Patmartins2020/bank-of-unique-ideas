// src/app/api/nda/upload/route.ts
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

  // ✅ single source of truth for bucket
  const BUCKET = (process.env.NDA_SIGNED_BUCKET || "signed-ndas").trim();

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

    // ✅ accept either key (so old HTML won’t break)
    const requestId =
      String(form.get("requestId") || "").trim() ||
      String(form.get("ndaId") || "").trim();

    const file = form.get("file");

    if (!requestId) return jsonError("Missing requestId/ndaId.", 400);
    if (!(file instanceof File)) return jsonError("Missing file.", 400);

    // file validation
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

    // validate nda row
    const { data: nda, error: ndaErr } = await sb
      .from("nda_requests")
      .select("id,status,signed_nda_path,signed_file_path")
      .eq("id", requestId)
      .maybeSingle();

    if (ndaErr) return jsonError("DB read failed.", 500, ndaErr.message);
    if (!nda) return jsonError("Invalid or expired NDA link.", 404);

    const status = String((nda as any).status || "").toLowerCase();

    // ✅ Upload must happen ONLY after admin confirmed request stage
    if (status !== "approved") {
      return jsonError(
        "NDA upload not allowed yet. Admin must confirm the request first.",
        403,
        { status }
      );
    }

    // prevent re-upload
    if ((nda as any).signed_nda_path || (nda as any).signed_file_path) {
      return jsonError("Signed NDA already uploaded.", 409);
    }

    // upload to storage
    const name = safeFileName(file.name);
    const path = `${requestId}/${Date.now()}_${name}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadErr } = await sb.storage.from(BUCKET).upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadErr) {
      return jsonError("Storage upload failed.", 500, uploadErr.message);
    }

    // ✅ update row so admin dashboard can see it
    // IMPORTANT FIX: "signed_at" column does not exist — use "signed_uploaded_at"
    const { error: updErr } = await sb
      .from("nda_requests")
      .update({
        status: "signed",
        signed_nda_path: path,
        signed_file_path: path,
        signed_uploaded_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updErr) return jsonError("DB update failed.", 500, updErr.message);

    return NextResponse.json({ ok: true, requestId, path }, { status: 200 });
  } catch (e: any) {
    return jsonError("Server error.", 500, e?.message || String(e));
  }
}