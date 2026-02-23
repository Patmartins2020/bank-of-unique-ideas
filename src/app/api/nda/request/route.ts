// src/app/api/nda/request/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400, details?: any) {
  return NextResponse.json(
    { ok: false, error: message, ...(details ? { details } : {}) },
    { status }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const ideaId = typeof body?.ideaId === "string" ? body.ideaId.trim() : "";
    const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";

    if (!ideaId) return jsonError("Missing ideaId", 400);
    if (!userId) return jsonError("Missing userId", 400); // keep as-is so your current frontend won’t break

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return jsonError("Server config error: missing Supabase env vars", 500, {
        hasUrl: !!SUPABASE_URL,
        hasServiceKey: !!SERVICE_KEY,
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // Prevent duplicate (latest request for same user+idea)
    const { data: existing, error: exErr } = await supabase
      .from("nda_requests")
      .select("id,status,created_at")
      .eq("idea_id", ideaId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (exErr) return jsonError("DB read failed", 500, exErr.message);

    if (existing && existing.length > 0) {
      return NextResponse.json({
        ok: true,
        message: "NDA request already exists. Admin will review it.",
      });
    }

    // ✅ IMPORTANT FIX: status must match DB allowed values
    const { error: insErr } = await supabase.from("nda_requests").insert([
      {
        idea_id: ideaId,
        user_id: userId,
        email: email || null,
        investor_email: email || null,
        status: "pending",
      },
    ]);

    if (insErr) return jsonError("Failed to create NDA request", 500, insErr.message);

    return NextResponse.json({
      ok: true,
      message: "NDA request sent. Admin will review it.",
    });
  } catch (e: any) {
    console.error("[API] /api/nda/request error:", e);
    return jsonError("Internal server error", 500, {
      message: e?.message || String(e),
      details: e?.details || e?.hint || e?.code || "",
    });
  }
}