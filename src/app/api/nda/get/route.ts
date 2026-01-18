// src/app/api/nda/get/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

function supabaseAdmin() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing NDA request id" }, { status: 400 });
  }

  const sb = supabaseAdmin();

  const { data, error } = await sb
    .from("nda_requests")
    .select("id,status,email,signed_nda_path,created_at,unblur_until")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Invalid NDA request" }, { status: 404 });

  // Return a consistent key name to the UI
  return NextResponse.json({
    nda: {
      id: data.id,
      status: data.status,
      investorEmail: data.email,
      signed_nda_path: data.signed_nda_path,
      created_at: data.created_at,
      unblur_until: data.unblur_until,
    },
  });
}