import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000";

  return raw.replace(/\/$/, "");
}

export async function POST(req: Request) {
  try {
    // ✅ investor-authenticated client (CORRECT)
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { ideaId } = await req.json();

    if (!ideaId) {
      return NextResponse.json({ error: "Missing ideaId" }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // Check idea
    const { data: idea } = await admin
      .from("ideas")
      .select("id,title,protected")
      .eq("id", ideaId)
      .maybeSingle();

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    if (!idea.protected) {
      return NextResponse.json({ ok: true });
    }

    // Create or reuse NDA request
    const { data: existing } = await admin
      .from("nda_requests")
      .select("id")
      .eq("idea_id", ideaId)
      .eq("email", user.email)
      .maybeSingle();

    let ndaId = existing?.id;

    if (!ndaId) {
      const { data: created } = await admin
        .from("nda_requests")
        .insert({
          idea_id: ideaId,
          email: user.email,
          status: "requested",
        })
        .select("id")
        .single();

      if (!created) {
        return NextResponse.json({ error: "Failed to create NDA request" }, { status: 500 });
      }

      ndaId = created.id;
    }

    // Notify admin (optional)
    if (ADMIN_EMAIL && RESEND_API_KEY) {
      const resend = new Resend(RESEND_API_KEY);
      const base = getBaseUrl();

      await resend.emails.send({
        from: "Bank of Unique Ideas <no-reply@bankofuniqueideas.com>",
        to: ADMIN_EMAIL,
        subject: `New NDA request`,
        html: `
          <p>Investor: ${user.email}</p>
          <p>Idea: ${idea.title}</p>
          <p><a href="${base}/admin">Open Admin Dashboard</a></p>
          <p>NDA ID: ${ndaId}</p>
        `,
      });
    }

    return NextResponse.json({ ok: true, ndaId });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}