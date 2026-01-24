import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ndaId = searchParams.get("ndaId");

    if (!ndaId) {
      return NextResponse.json({ error: "Missing ndaId" }, { status: 400 });
    }

    // IMPORTANT: Use SERVICE ROLE on server only
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const { data: nda, error } = await supabaseAdmin
      .from("nda_requests")
      .select("id, status, unblur_until, idea_id")
      .eq("id", ndaId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!nda) {
      return NextResponse.json({ error: "NDA not found" }, { status: 404 });
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

    // This is the "right page" to view the idea
    const redirectTo = `/investor/ideas/${nda.idea_id}`;

    return NextResponse.json({ redirectTo }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}