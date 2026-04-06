import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { ok: false, error: 'Missing "to", "subject" or "html".' },
        { status: 400 }
      );
    }

    // ✅ dedicated global mail provider variable
    const provider = process.env.EMAIL_PROVIDER || 'stub';

    console.log('[SEND EMAIL] provider:', provider, 'to:', to);

    // =========================
    // DEV / SAFE STUB MODE
    // =========================
    if (provider === 'stub') {
      console.log('[EMAIL STUB]', {
        to,
        subject,
        preview: html.slice(0, 120) + '...',
      });

      return NextResponse.json({
        ok: true,
        provider: 'stub',
        message: 'Stub email logged successfully',
      });
    }

    // =========================
    // RESEND MODE
    // =========================
    if (provider === 'resend') {
      const apiKey = process.env.RESEND_API_KEY;
      const from =
        process.env.EMAIL_FROM ||
        'Bank of Unique Ideas <receipts@bankofuniqueideas.com>';

      if (!apiKey) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Missing RESEND_API_KEY',
          },
          { status: 500 }
        );
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          html,
        }),
      });

      const data = await response.json().catch(() => null);

      console.log('[RESEND RESULT]', response.status, data);

      if (!response.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Resend API failed',
            detail: data,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        provider: 'resend',
        data,
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: 'Invalid EMAIL_PROVIDER value',
      },
      { status: 500 }
    );
  } catch (err: any) {
    console.error('[SEND EMAIL ROUTE ERROR]', err);

    return NextResponse.json(
      {
        ok: false,
        error: err?.message || 'Unexpected server error',
      },
      { status: 500 }
    );
  }
}