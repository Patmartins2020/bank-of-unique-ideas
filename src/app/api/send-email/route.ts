import { NextResponse } from 'next/server';

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing "to", "subject" or "html"' },
        { status: 400 }
      );
    }

    const provider = process.env.NEXT_PUBLIC_NDA_PROVIDER ?? 'stub';

    // ✅ REAL EMAIL SENDING VIA RESEND
    if (provider === 'resend') {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        console.error('RESEND_API_KEY is missing in env');
        return NextResponse.json(
          { error: 'Email provider not configured' },
          { status: 500 }
        );
      }

      const from =
        process.env.EMAIL_FROM ||
        'Bank of Unique Ideas <onboarding@resend.dev>';

      const resendRes = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          html,
        }),
      });

      if (!resendRes.ok) {
        const text = await resendRes.text();
        console.error('Resend API error:', resendRes.status, text);
        return NextResponse.json(
          { error: 'Failed to send email' },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true });
    }

    // 🧪 FALLBACK: stub mode (just logs)
    console.log('DEV EMAIL (not actually sent):', {
      to,
      subject,
      html,
    });

    return NextResponse.json({ ok: true, stub: true });
  } catch (e: any) {
    console.error('send-email route error:', e);
    return NextResponse.json(
      { error: e?.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}