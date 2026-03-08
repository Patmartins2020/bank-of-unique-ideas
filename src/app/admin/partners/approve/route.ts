import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Supabase server client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { partnerId } = await req.json();

    if (!partnerId) {
      return NextResponse.json(
        { error: "Missing partnerId" },
        { status: 400 }
      );
    }

    // Get partner details
    const { data: partner, error } = await supabase
      .from("partners")
      .select("*")
      .eq("id", partnerId)
      .single();

    if (error || !partner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      );
    }

    // Update partner status
    const { error: updateError } = await supabase
      .from("partners")
      .update({ status: "approved" })
      .eq("id", partnerId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Send approval email
    await resend.emails.send({
      from: "GlobUI <onboarding@resend.dev>",
      to: partner.email,
      subject: "GlobUI Partnership Approval",
      html: `
        <h2>GlobUI Partnership Approval</h2>

        <p>Hello ${partner.name || ""},</p>

        <p>Your partnership request has been approved.</p>

        <p>Our team will contact you shortly regarding the next steps.</p>

        <br/>

        <p>Thank you for joining the Global Bank of Unique Ideas.</p>

        <strong>GlobUI Team</strong>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Partner approved and email sent.",
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}