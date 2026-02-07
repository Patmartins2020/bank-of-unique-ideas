import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
    const EMAIL_FROM =
      process.env.EMAIL_FROM || "Bank of Unique Ideas <no-reply@bankofuniqueideas.com>";
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

    if (!SUPABASE_URL) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_SUPABASE_URL" }, { status: 500 });
    }
    if (!SERVICE_KEY) {
      return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
    }

    // ✅ IMPORTANT: pass `cookies` directly (NOT cookies(), NOT () => cookies())
    const supabase = createRouteHandlerClient({ cookies });

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const email = authData.user.email || "";
    if (!email) {
      return NextResponse.json({ error: "User email missing" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const ideaId = typeof body?.ideaId === "string" ? body.ideaId.trim() : "";
    if (!ideaId) {
      return NextResponse.json({ error: "Missing ideaId" }, { status: 400 });
    }

    // ✅ Admin client (bypass RLS safely)
    const sbAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    const { data: ideaRow, error: ideaErr } = await sbAdmin
      .from("ideas")
      .select("id,title,protected,status")
      .eq("id", ideaId)
      .maybeSingle();

    if (ideaErr) return NextResponse.json({ error: ideaErr.message }, { status: 500 });
    if (!ideaRow) return NextResponse.json({ error: "Idea not found" }, { status: 404 });

    if (!ideaRow.protected) {
      return NextResponse.json({ ok: true, message: "This idea does not require NDA." }, { status: 200 });
    }

    const { data: existing, error: existErr } = await sbAdmin
      .from("nda_requests")
      .select("id,status,created_at")
      .eq("idea_id", ideaId)
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existErr) return NextResponse.json({ error: existErr.message }, { status: 500 });

    let ndaId = existing?.id as string | undefined;
    let status = (existing?.status as string | null) ?? null;

    if (!ndaId) {
      const { data: created, error: createErr } = await sbAdmin
        .from("nda_requests")
        .insert({ idea_id: ideaId, email, status: "requested" })
        .select("id,status")
        .maybeSingle();

      if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });

      ndaId = created?.id;
      status = created?.status ?? "requested";
    }

    // Optional email to admin
    if (ADMIN_EMAIL && RESEND_API_KEY) {
      try {
        const resend = new Resend(RESEND_API_KEY);
        await resend.emails.send({
          from: EMAIL_FROM,
          to: ADMIN_EMAIL,
          subject: `New NDA request | ${ideaRow.title ?? "Idea"}`,
          html: `
            <p>Hello Admin,</p>
            <p>An investor requested NDA access for:</p>
            <p><strong>${ideaRow.title ?? "Idea"}</strong></p>
            <p><strong>Investor:</strong> ${email}</p>
            <p><small>NDA Request ID: ${ndaId}</small></p>
          `,
        });
      } catch {
        // ignore email failure
      }
    }

    return NextResponse.json(
      { ok: true, ndaId, status, message: "NDA request sent. Please wait for admin approval." },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}