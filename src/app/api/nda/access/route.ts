import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ndaId = (searchParams.get("ndaId") || "").trim();

    if (!ndaId) {
      return NextResponse.json({ error: "Missing ndaId" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Missing Supabase env vars (URL or SERVICE ROLE KEY)" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // ✅ KEY FIX: support BOTH "id" and "nda_id"
    const { data: nda, error } = await supabaseAdmin
      .from("nda_requests")
      .select("id, nda_id, status, unblur_until, idea_id")
      .or(`id.eq.${ndaId},nda_id.eq.${ndaId}`)
      .maybeSingle();

    if (error) {
      console.error("NDA access lookup error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!nda) {
      return NextResponse.json(
        { error: "Invalid NDA ID (not found in DB)" },
        { status: 404 }
      );
    }

    if (nda.status !== "approved") {
      return NextResponse.json({ error: "NDA not approved" }, { status: 403 });
    }

    if (!nda.unblur_until) {
      return NextResponse.json({ error: "Missing unblur_until" }, { status: 403 });
    }

    const expires = new Date(nda.unblur_until).getTime();
    if (Number.isNaN(expires) || Date.now() > expires) {
      return NextResponse.json({ error: "NDA access expired" }, { status: 403 });
    }

    // ✅ Redirect to your investor view page
    const redirectTo = `/investor/ideas/${nda.idea_id}`;
    return NextResponse.json({ redirectTo }, { status: 200 });
  } catch (e: any) {
    console.error("NDA access fatal:", e?.message || String(e));
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}