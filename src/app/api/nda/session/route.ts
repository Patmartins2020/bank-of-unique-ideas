// src/app/api/nda/session/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function jsonError(message: string, status = 400, details?: any) {
  return json(
    { ok: false, error: message, ...(details ? { details } : {}) },
    status
  );
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function GET() {
  try {
    // 1) Read cookie safely (NO CRASH)
    const cookieStore = await cookies();
const raw = cookieStore.get("nda_access")?.value;
    const ndaId = typeof raw === "string" && raw.trim() ? raw.trim() : null;

    if (!ndaId) {
      return json({
        ok: true,
        hasToken: false,
        ndaId: null,
        unlockedIdeaIds: [],
        unblurUntil: null,
        reason: "Missing nda_access cookie",
      });
    }

    // 2) DB lookup (server-side / admin)
    const sb = adminClient();
    if (!sb) return jsonError("Missing Supabase env vars.", 500);

    const { data: nda, error } = await sb
      .from("nda_requests")
      .select("id, status, idea_id, unblur_until")
      .eq("id", ndaId)
      .maybeSingle();

    if (error) return jsonError("DB read failed.", 500, error.message);

    if (!nda) {
      return json({
        ok: true,
        hasToken: true,
        ndaId,
        unlockedIdeaIds: [],
        unblurUntil: null,
        reason: "NDA request not found",
      });
    }

    const status = String(nda.status || "").toLowerCase();
    const ideaId = nda.idea_id ? String(nda.idea_id) : null;

    // 3) Only verified + not expired = unlocked
    const unblurUntil = nda.unblur_until ? String(nda.unblur_until) : null;

    const isVerified = status === "verified";
    const isExpired =
      !unblurUntil ? true : new Date(unblurUntil).getTime() <= Date.now();

    if (!ideaId || !isVerified || isExpired) {
      return json({
        ok: true,
        hasToken: true,
        ndaId,
        status,
        unlockedIdeaIds: [],
        unblurUntil,
        reason: !ideaId
          ? "Missing idea_id"
          : !isVerified
          ? "Not verified yet"
          : "Access expired",
      });
    }

    return json({
      ok: true,
      hasToken: true,
      ndaId,
      status,
      unlockedIdeaIds: [ideaId],
      unblurUntil,
    });
  } catch (e: any) {
    return jsonError("Server error.", 500, e?.message || String(e));
  }
}