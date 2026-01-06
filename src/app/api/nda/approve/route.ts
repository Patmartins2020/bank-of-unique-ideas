import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM =
  process.env.EMAIL_FROM || 'Bank of Unique Ideas <no-reply@bankofuniqueideas.com>';

export async function POST(req: Request) {
  try {
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is missing in environment');
      return NextResponse.json(
        { error: 'Email service is not configured.' },
        { status: 500 }
      );
    }

    const body = await req.json();

    const {
      ndaId,
      investorEmail,
      investorName,
      ideaTitle,
      decision, // 'approved' | 'rejected'
      unblurUntil,
    } = body || {};

    if (!investorEmail || !decision) {
      return NextResponse.json(
        { error: 'Missing required fields: investorEmail or decision.' },
        { status: 400 }
      );
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'https://bankofuniqueideas.com';

    let subject: string;
    let html: string;

    if (decision === 'approved') {
      const ndaLink = ndaId
        ? `${siteUrl}/nda/${ndaId}`
        : `${siteUrl}/nda`;

      subject = `NDA approved – ${ideaTitle || 'idea'}`;
      html = `
        <p>Dear ${investorName || 'Investor'},</p>
        <p>Your NDA request for <strong>${ideaTitle || 'our idea'}</strong> has been approved.</p>
        <p>Please click the link below to download and sign the NDA, then upload the signed copy:</p>
        <p><a href="${ndaLink}">${ndaLink}</a></p>
        ${
          unblurUntil
            ? `<p>After the signed NDA is received and confirmed, your access to the full idea brief will be active until <strong>${new Date(
                unblurUntil
              ).toLocaleString()}</strong>.</p>`
            : ''
        }
        <p>Best regards,<br/>Bank of Unique Ideas</p>
      `;
    } else if (decision === 'rejected') {
      subject = `NDA request not approved – ${ideaTitle || 'idea'}`;
      html = `
        <p>Dear ${investorName || 'Investor'},</p>
        <p>Your NDA request for <strong>${ideaTitle || 'our idea'}</strong> was not approved at this time.</p>
        <p>You may contact us if you need more information.</p>
        <p>Best regards,<br/>Bank of Unique Ideas</p>
      `;
    } else {
      return NextResponse.json(
        { error: 'Invalid decision value.' },
        { status: 400 }
      );
    }

    const resend = new Resend(RESEND_API_KEY);

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: investorEmail,
      subject,
      html,
    });

    console.log('Resend /api/nda/approve response:', result);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('/api/nda/approve route crashed:', err);
    return NextResponse.json(
      { error: 'Unexpected server error.', detail: err?.message },
      { status: 500 }
    );
  }
}