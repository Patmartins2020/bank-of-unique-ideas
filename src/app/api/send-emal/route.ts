import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: "Missing to, subject, or html" },
        { status: 400 }
      );
    }

    await resend.emails.send({
      // For now, use Resend's default sender to avoid domain issues
      from: "onboarding@resend.dev",
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Email error:", e);
    return NextResponse.json(
      { success: false, error: e?.message ?? "Email failed" },
      { status: 500 }
    );
  }
}