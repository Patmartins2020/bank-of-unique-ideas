import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json(
      { error: "Server misconfigured: missing SUPABASE env vars." },
      { status: 500 }
    );
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing NDA request id" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("nda_requests")
    .select("id,status,email,investor_email,signed_nda_path,created_at,unblur_until")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Invalid NDA request" }, { status: 404 });

  const investorEmail = (data as any).email ?? (data as any).investor_email ?? null;

  return NextResponse.json({
    nda: {
      id: data.id,
      status: data.status,
      investorEmail,
      signed_nda_path: (data as any).signed_nda_path ?? null,
      created_at: data.created_at,
      unblur_until: (data as any).unblur_until ?? null,
    },
  });
}