import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra ? extra : {}) },
    { status }
  );
}

export async function POST(req: Request) {
  try {
    // 1) Get the logged-in user from cookies/session
    const supabaseAuth = createRouteHandlerClient({ cookies });
    const { data: authData, error: authErr } = await supabaseAuth.auth.getUser();

    if (authErr || !authData?.user) {
      return jsonError("Not authenticated", 401);
    }

    const user = authData.user;

    // 2) Parse body
    const body: any = await req.json().catch(() => null);
    const ideaId = body?.ideaId;

    if (!ideaId || typeof ideaId !== "string") {
      return jsonError("Missing ideaId", 400);
    }

    // 3) Service role client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return jsonError("Server config error: missing Supabase env vars", 500, {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!serviceKey,
      });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 4) Optional: load investor name
    const { data: prof } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const investorName =
      (prof?.full_name as string | null) ||
      (user.user_metadata as any)?.full_name ||
      null;

    const investorEmail = user.email || null;

    // 5) Avoid duplicate pending requests
    const { data: existing } = await admin
      .from("nda_requests")
      .select("id,status")
      .eq("idea_id", ideaId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      const last = existing[0];
      if (last.status === "pending") {
        return NextResponse.json({
          ok: true,
          message: "NDA request already pending. Admin will review it.",
        });
      }
      if (last.status === "confirmed") {
        return NextResponse.json({
          ok: true,
          message: "Your NDA request was already confirmed. Check your email.",
        });
      }
    }

    // 6) Insert request
    const { error: insErr } = await admin.from("nda_requests").insert([
      {
        idea_id: ideaId,
        user_id: user.id,
        status: "pending",
        investor_email: investorEmail,
        investor_name: investorName,
        email: investorEmail,
      },
    ]);

    if (insErr) {
      return jsonError("Failed to create NDA request", 500, {
        message: insErr.message,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "NDA request sent. Admin will review it.",
    });
  } catch (e: unknown) {
    console.error("[API] NDA error:", e);

    const err = e as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    return jsonError("Internal server error", 500, {
      message: err?.message ?? String(e),
      details: err?.details ?? err?.hint ?? err?.code ?? "",
    });
  }
}