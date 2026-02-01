// src/app/api/nda/access/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getEnv() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return { SUPABASE_URL, SERVICE_KEY };
}

function isUuid(v: string) {
  // strict UUID v1-v5
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ndaIdRaw = (searchParams.get("ndaId") || "").trim();

    if (!ndaIdRaw) {
      return NextResponse.json({ error: "Missing ndaId" }, { status: 400 });
    }

    // If your nda_requests.id is a UUID column (most common), we MUST validate.
    // This prevents PostgREST from throwing "invalid input syntax for type uuid".
    if (!isUuid(ndaIdRaw)) {
      return NextResponse.json({ error: "Invalid NDA ID." }, { status: 400 });
    }

    const { SUPABASE_URL, SERVICE_KEY } = getEnv();

    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error("❌ Missing Supabase env vars for NDA access", {
        hasUrl: Boolean(SUPABASE_URL),
        hasServiceKey: Boolean(SERVICE_KEY),
      });
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    const { data: nda, error } = await supabaseAdmin
      .from("nda_requests")
      .select("id, status, unblur_until, idea_id")
      .eq("id", ndaIdRaw)
      .maybeSingle();

    if (error) {
      console.error("❌ Supabase NDA access read failed", {
        ndaId: ndaIdRaw,
        message: error.message,
      });
      return NextResponse.json({ error: "Invalid NDA ID." }, { status: 400 });
    }

    if (!nda) {
      return NextResponse.json({ error: "Invalid NDA ID." }, { status: 404 });
    }

    if (nda.status !== "approved") {
      return NextResponse.json({ error: "NDA not approved" }, { status: 403 });
    }

    if (!nda.unblur_until) {
      return NextResponse.json(
        { error: "Missing unblur_until" },
        { status: 403 }
      );
    }

    const expires = new Date(nda.unblur_until).getTime();
    if (Number.isNaN(expires) || Date.now() > expires) {
      return NextResponse.json({ error: "NDA access expired" }, { status: 403 });
    }

    // ✅ Make sure THIS route actually exists in your app (otherwise you'll redirect to a 404)
    const redirectTo = `/investor/ideas/${nda.idea_id}`;

    return NextResponse.json({ redirectTo }, { status: 200 });
  } catch (e: any) {
    console.error("❌ NDA access API fatal", e?.message || e);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}