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

  const base = String(raw).trim().replace(/\/$/, "");
  if (!/^https?:\/\//i.test(base)) return "http://localhost:3000";
  return base;
}

function getEnv() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
  const EMAIL_FROM =
    process.env.EMAIL_FROM ||
    "Bank of Unique Ideas <no-reply@bankofuniqueideas.com>";
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ""; // set in Vercel
  return { SUPABASE_URL, SERVICE_KEY, RESEND_API_KEY, EMAIL_FROM, ADMIN_EMAIL };
}

export async function POST(req: Request) {
  try {
    const { SUPABASE_URL, SERVICE_KEY, RESEND_API_KEY, EMAIL_FROM, ADMIN_EMAIL } =
      getEnv();

    if (!SUPABASE_URL) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL" },
        { status: 500 }
      );
    }

    // ✅ Authenticated supabase (investor)
  const supabase = createRouteHandlerClient({ cookies: () => cookies() });
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const email = user.email || "";
    if (!email) {
      return NextResponse.json({ error: "User email missing" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const ideaId =
      typeof body?.ideaId === "string" ? body.ideaId.trim() : "";

    if (!ideaId) {
      return NextResponse.json({ error: "Missing ideaId" }, { status: 400 });
    }

    // ✅ Admin supabase (to bypass RLS safely)
    if (!SERVICE_KEY) {
      return NextResponse.json(
        { error: "Missing SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const sbAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // 1) Ensure idea exists (optional title for email)
    const { data: ideaRow, error: ideaErr } = await sbAdmin
      .from("ideas")
      .select("id,title,protected,status")
      .eq("id", ideaId)
      .maybeSingle();

    if (ideaErr) {
      return NextResponse.json({ error: ideaErr.message }, { status: 500 });
    }
    if (!ideaRow) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // If not protected, no NDA needed
    if (!ideaRow.protected) {
      return NextResponse.json(
        { ok: true, message: "This idea does not require NDA." },
        { status: 200 }
      );
    }

    // 2) Reuse existing request if already exists (prevents duplicates)
    const { data: existing, error: existErr } = await sbAdmin
      .from("nda_requests")
      .select("id,status,created_at")
      .eq("idea_id", ideaId)
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existErr) {
      return NextResponse.json({ error: existErr.message }, { status: 500 });
    }

    let ndaId = existing?.id as string | undefined;
    let status = (existing?.status as string | null) ?? null;

    if (!ndaId) {
      // Create new request
      const { data: created, error: createErr } = await sbAdmin
        .from("nda_requests")
        .insert({
          idea_id: ideaId,
          email,
          status: "requested",
        })
        .select("id,status")
        .maybeSingle();

      if (createErr) {
        return NextResponse.json({ error: createErr.message }, { status: 500 });
      }

      ndaId = created?.id;
      status = created?.status ?? "requested";
    }

    // 3) Email admin (optional but recommended)
    // If no ADMIN_EMAIL configured, we still succeed
    if (ADMIN_EMAIL && RESEND_API_KEY) {
      const resend = new Resend(RESEND_API_KEY);

      const base = getBaseUrl();
      const adminDashboard = `${base}/admin`; // change if your admin path differs

      const subject = `New NDA request | ${ideaRow.title ?? "Idea"}`;
      const html = `
        <p>Hello Admin,</p>
        <p>An investor requested NDA access for:</p>
        <p><strong>${ideaRow.title ?? "Idea"}</strong></p>
        <p><strong>Investor:</strong> ${email}</p>
        <p>Open admin dashboard to review:</p>
        <p><a href="${adminDashboard}">${adminDashboard}</a></p>
        <p><small>NDA Request ID: ${ndaId}</small></p>
      `;

      // don't crash the whole request if email fails
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: ADMIN_EMAIL,
          subject,
          html,
        });
      } catch (e) {
        // ignore email errors; the request still exists
      }
    }

    return NextResponse.json(
      {
        ok: true,
        ndaId,
        status,
        message: "NDA request sent. Please wait for admin approval email.",
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}