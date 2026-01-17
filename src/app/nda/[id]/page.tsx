// src/app/api/nda/upload/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "signed-ndas";

function supabaseAdmin() {
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  const sb = supabaseAdmin();

  const form = await req.formData();
  const file = form.get("file");
  const requestId = String(form.get("requestId") || "");

  if (!requestId) return NextResponse.json({ error: "Missing requestId." }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file." }, { status: 400 });

  // Server-side file validation
  const maxBytes = 10 * 1024 * 1024;
  const allowed = ["application/pdf", "image/png", "image/jpeg"];

  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Only PDF, PNG, or JPG files are allowed." }, { status: 400 });
  }
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "File too large (max 10MB)." }, { status: 400 });
  }

  // Validate NDA request state
  const { data: nda, error: ndaErr } = await sb
    .from("nda_requests")
    .select("id,status,signed_nda_path")
    .eq("id", requestId)
    .maybeSingle();

  if (ndaErr) return NextResponse.json({ error: ndaErr.message }, { status: 500 });
  if (!nda) return NextResponse.json({ error: "Invalid or expired NDA link." }, { status: 404 });

  if (nda.status === "rejected") return NextResponse.json({ error: "This NDA request was rejected." }, { status: 403 });
  if (nda.status === "approved") return NextResponse.json({ error: "This NDA is already approved." }, { status: 409 });
  if (nda.status === "signed" || nda.signed_nda_path) {
    return NextResponse.json({ error: "Signed NDA already uploaded." }, { status: 409 });
  }

  const ext =
    file.type === "application/pdf" ? "pdf" :
    file.type === "image/png" ? "png" :
    "jpg";

  const path = `${requestId}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const { error: uploadErr } = await sb.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { error: updErr } = await sb
    .from("nda_requests")
    .update({
      status: "signed",
      signed_nda_path: path,
      signed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 200 });
}