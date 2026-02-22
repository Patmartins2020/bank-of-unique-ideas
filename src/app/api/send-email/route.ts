import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      console.error('send-email: missing fields', { to, subject, hasHtml: !!html });
      return NextResponse.json(
        { error: 'Missing "to", "subject" or "html".' },
        { status: 400 }
      );
    }

    const provider = process.env.NEXT_PUBLIC_NDA_PROVIDER ?? 'stub';
    console.log('send-email: provider =', provider, 'pendingTo =', to);

    // DEV STUB – just log, no real email
    if (provider === 'stub') {
      console.log('DEV EMAIL (stub only):', {
        to,
        subject,
        previewHtmlStart: html.slice(0, 120) + '...',
      });
      return NextResponse.json({ ok: true, provider: 'stub' });
    }

    // REAL EMAIL VIA RESEND
    if (provider === 'resend') {
      const apiKey = process.env.RESEND_API_KEY;
      const from =
        process.env.EMAIL_FROM || 'Bank of Unique Ideas <onboarding@resend.dev>';

      if (!apiKey) {
        console.error('send-email: RESEND_API_KEY is missing');
        return NextResponse.json(
          { error: 'Missing RESEND_API_KEY in environment.' },
          { status: 500 }
        );
      }

      // 🔴 VERY IMPORTANT:
      // In development, ALWAYS send to your own Resend account email.
      const testRecipient =
        process.env.RESEND_TEST_TO || 'anewdawn1st@gmail.com';

      const finalTo =
        process.env.NODE_ENV === 'development' ? testRecipient : to;

      console.log('send-email: sending via Resend', {
        from,
        pendingTo: to,
        finalTo,
        env: process.env.NODE_ENV,
      });

      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to: finalTo,
          subject,
          html,
        }),
      });

      const data = await resp.json().catch(() => null);
      console.log(
        'send-email: Resend response status =',
        resp.status,
        'body =',
        data
      );

      if (!resp.ok) {
        return NextResponse.json(
          { error: 'Resend API error', detail: data },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, provider: 'resend', data });
    }

    console.error('send-email: unknown provider value', provider);
    return NextResponse.json(
      { error: 'Invalid email provider configuration.' },
      { status: 500 }
    );
  } catch (err: any) {
    console.error('send-email: route crashed', err);
    return NextResponse.json(
      { error: 'Unexpected server error.', detail: err?.message },
      { status: 500 }
    );
  }
}