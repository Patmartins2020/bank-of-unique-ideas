// src/app/api/nda/download/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "nda_files";
const TEMPLATE_PATH = "templates/nda.pdf";

function supabaseAdmin() {
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const sb = supabaseAdmin();

  // Validate request exists
  const { data: nda, error: ndaErr } = await sb
    .from("nda_requests")
    .select("id,status")
    .eq("id", id)
    .maybeSingle();

  if (ndaErr) return NextResponse.json({ error: ndaErr.message }, { status: 500 });
  if (!nda) return NextResponse.json({ error: "Invalid or expired NDA link." }, { status: 404 });
  if (nda.status === "rejected") return NextResponse.json({ error: "NDA request rejected." }, { status: 403 });

  // Create signed URL to template
  const { data: signed, error: signErr } = await sb.storage
    .from(BUCKET)
    .createSignedUrl(TEMPLATE_PATH, 60); // 60 seconds

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: signErr?.message || "Could not generate download link." }, { status: 500 });
  }

  // Redirect browser to signed URL
  return NextResponse.redirect(signed.signedUrl, { status: 302 });
}