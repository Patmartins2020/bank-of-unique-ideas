import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {

    const { searchParams } = new URL(req.url);
    const ndaId = (searchParams.get("ndaId") || "").trim();

    if (!ndaId) {
      return NextResponse.json(
        { error: "Missing ndaId" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceKey,
      { auth: { persistSession: false } }
    );

    const { data: nda, error } = await supabaseAdmin
      .from("nda_requests")
      .select("id, status, unblur_until, idea_id")
      .eq("id", ndaId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!nda) {
      return NextResponse.json(
        { error: "NDA request not found" },
        { status: 404 }
      );
    }

    const status = String(nda.status || "").toLowerCase();

    /*
    ==========================================
    STAGE 1
    Admin approved request → allow upload
    ==========================================
    */

    if (status === "approved") {
      return NextResponse.json({
        status: "approved",
        ideaId: nda.idea_id
      });
    }

    /*
    ==========================================
    STAGE 2
    Investor uploaded signed NDA
    ==========================================
    */

    if (status === "signed") {
      return NextResponse.json({
        status: "signed",
        ideaId: nda.idea_id
      });
    }

    /*
    ==========================================
    STAGE 3
    Admin verified signed NDA → allow access
    ==========================================
    */

    if (status === "confirmed") {

      if (!nda.unblur_until) {
        return NextResponse.json({
          error: "Access window missing"
        }, { status: 403 });
      }

      const expires = new Date(nda.unblur_until).getTime();

      if (Number.isNaN(expires) || Date.now() > expires) {
        return NextResponse.json({
          error: "NDA access expired"
        }, { status: 403 });
      }

      return NextResponse.json({
        status: "verified",
        redirectTo: `/investor/ideas/${nda.idea_id}`
      });
    }

    /*
    ==========================================
    PENDING OR UNKNOWN STATUS
    ==========================================
    */

    return NextResponse.json({
      status: status || "pending"
    });

  } catch (e: any) {

    return NextResponse.json(
      { error: e?.message || "Unexpected server error" },
      { status: 500 }
    );

  }
}