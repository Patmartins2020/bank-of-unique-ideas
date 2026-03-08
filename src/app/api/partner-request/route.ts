import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Payload = {
  orgName: string;
  orgType: string;
  partnershipType: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  country?: string;
  website?: string;
  message?: string;
};

// simple email validation
function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// send notification email to admin
async function sendNotificationEmail(subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.PARTNER_NOTIFY_EMAIL;

  if (!apiKey || !notifyEmail) {
    console.warn("Email skipped: RESEND_API_KEY or PARTNER_NOTIFY_EMAIL missing");
    return;
  }

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GlobUI <onboarding@resend.dev>",
        to: [notifyEmail],
        subject,
        html,
      }),
    });
  } catch (err) {
    console.error("Email send failed:", err);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Payload>;

    const orgName = body.orgName?.trim() || "";
    const orgType = body.orgType?.trim() || "";
    const partnershipType = body.partnershipType?.trim() || "";
    const contactName = body.contactName?.trim() || "";
    const contactEmail = body.contactEmail?.trim() || "";
    const contactPhone = body.contactPhone?.trim() || null;
    const country = body.country?.trim() || null;
    const website = body.website?.trim() || null;
    const message = body.message?.trim() || null;

    // validation
    if (!orgName || !orgType || !partnershipType || !contactName || !contactEmail) {
      return NextResponse.json(
        { ok: false, error: "Please fill all required fields." },
        { status: 400 }
      );
    }

    if (!isEmail(contactEmail)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // save request
    const { data, error } = await supabase
      .from("partner_requests")
      .insert({
        org_name: orgName,
        org_type: orgType,
        partnership_type: partnershipType,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        country,
        website,
        message,
        status: "new",
      })
      .select("id, created_at")
      .single();

    if (error) throw error;

    // notify admin
    await sendNotificationEmail(
      `New GlobUI Partnership Request (${orgName})`,
      `
      <div style="font-family:Arial,sans-serif">
        <h2>New Partnership Request</h2>

        <p><b>Organization:</b> ${orgName}</p>
        <p><b>Organization Type:</b> ${orgType}</p>
        <p><b>Partnership Type:</b> ${partnershipType}</p>

        <hr/>

        <p><b>Contact Name:</b> ${contactName}</p>
        <p><b>Email:</b> ${contactEmail}</p>

        ${contactPhone ? `<p><b>Phone:</b> ${contactPhone}</p>` : ""}
        ${country ? `<p><b>Country:</b> ${country}</p>` : ""}
        ${website ? `<p><b>Website:</b> ${website}</p>` : ""}

        ${message ? `<p><b>Message:</b><br/>${message.replace(/\n/g, "<br/>")}</p>` : ""}

        <hr/>

        <p><b>Request ID:</b> ${data.id}</p>
        <p>Login to the GlobUI admin dashboard to review this request.</p>
      </div>
      `
    );

    return NextResponse.json({ ok: true, id: data.id });

  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to submit request." },
      { status: 500 }
    );
  }
}