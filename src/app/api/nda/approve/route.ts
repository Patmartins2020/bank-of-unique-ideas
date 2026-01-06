import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Expecting { investorEmail, investorName, ndaId }
    const { investorEmail, investorName, ndaId } = body;

    if (!investorEmail) {
      return NextResponse.json(
        { error: "Missing investorEmail" },
        { status: 400 }
      );
    }

    const from =
      process.env.EMAIL_FROM ||
      "no-reply@bankofuniqueideas.com";

    const ndaLink = `${process.env.NEXT_PUBLIC_SITE_URL || "https://bankofuniqueideas.com"}/nda/${ndaId ?? ""}`;

    const { error } = await resend.emails.send({
      from,
      to: [investorEmail],
      subject: "Your NDA is ready to view",
      html: `
        <p>Hello ${investorName || "Investor"},</p>
        <p>The NDA for your account is ready.</p>
        <p>
          Please click the link below to review and sign:
        </p>
        <p>
          <a href="${ndaLink}" target="_blank" rel="noopener noreferrer">
            View NDA
          </a>
        </p>
        <p>Bank of Unique Ideas</p>
      `,
    });

    if (error) {
      console.error("Resend error sending NDA email:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("NDA approve API error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}