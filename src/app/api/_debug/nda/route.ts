import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ndaId = (searchParams.get("ndaId") || "").trim();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  const host = supabaseUrl ? new URL(supabaseUrl).host : "";

  if (!ndaId) {
    return NextResponse.json({ ok: false, error: "missing ndaId", host }, { status: 400 });
  }

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { ok: false, error: "missing env", hasUrl: !!supabaseUrl, hasKey: !!serviceKey, host },
      { status: 500 }
    );
  }

  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data, error } = await sb
    .from("nda_requests")
    .select("id,status,unblur_until,idea_id")
    .eq("id", ndaId)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    host,
    ndaId,
    found: !!data,
    row: data || null,
    error: error?.message || null,
  });
}