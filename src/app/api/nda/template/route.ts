import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// CHANGE THESE 2 TO MATCH YOUR SETUP
const BUCKET = "nda_files";
const TEMPLATE_PATH = "template/NDA.pdf"; // you said: template/NDA.pdf

function supabaseAdmin() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get("requestId");

  if (!requestId) {
    return NextResponse.json({ error: "Missing requestId." }, { status: 400 });
  }

  const sb = supabaseAdmin();

  // Validate NDA request exists (prevents random template abuse)
  const { data: nda, error: ndaErr } = await sb
    .from("nda_requests")
    .select("id,status")
    .eq("id", requestId)
    .maybeSingle();

  if (ndaErr) return NextResponse.json({ error: ndaErr.message }, { status: 500 });
  if (!nda) return NextResponse.json({ error: "Invalid or expired NDA link." }, { status: 404 });
  if (nda.status === "rejected") return NextResponse.json({ error: "This NDA request was rejected." }, { status: 403 });

  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(TEMPLATE_PATH, 60 * 10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ url: data.signedUrl }, { status: 200 });
}