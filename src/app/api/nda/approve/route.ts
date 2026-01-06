import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

type ApproveBody = {
  investorEmail?: string;
  investorName?: string;
  ndaId?: string;
  ideaId?: string;
};

export async function POST(req: NextRequest) {
  console.log('[NDA APPROVE] Handler started');

  // 1) Get and validate API key
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[NDA APPROVE] RESEND_API_KEY is missing in environment');
    return NextResponse.json(
      { error: 'Email service is not configured.' },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);

  try {
    // 2) Parse body
    const body = (await req.json()) as ApproveBody;
    console.log('[NDA APPROVE] Request body:', body);

    const { investorEmail, investorName, ndaId, ideaId } = body;

    if (!investorEmail) {
      console.error('[NDA APPROVE] Missing investorEmail');
      return NextResponse.json(
        { error: 'Missing investorEmail' },
        { status: 400 }
      );
    }

    // 3) OPTIONAL: your Supabase / DB update goes here
    //    (Leave this commented until you’re ready to plug it back)
    //
    // import { supabase } from '@/lib/supabase';
    // const { error: dbError } = await supabase
    //   .from('ndas')
    //   .update({ status: 'approved' })
    //   .eq('id', ndaId);
    //
    // if (dbError) {
    //   console.error('[NDA APPROVE] Supabase error:', dbError);
    //   return NextResponse.json(
    //     { error: 'Failed to update NDA status' },
    //     { status: 500 }
    //   );
    // }

    // 4) Prepare email
    const from =
      process.env.EMAIL_FROM || 'Bank of Unique Ideas <no-reply@bankofuniqueideas.com>';

    const safeName = investorName || 'Investor';
    const ndaInfo = ndaId ? ` (NDA ID: ${ndaId})` : '';
    const ideaInfo = ideaId ? ` for idea ${ideaId}` : '';

    const subject = 'Your NDA has been approved';
    const html = `
      <p>Dear ${safeName},</p>
      <p>Your NDA${ndaInfo}${ideaInfo} has been approved on <strong>Bank of Unique Ideas</strong>.</p>
      <p>You can now continue with the next steps on the platform.</p>
      <p>Best regards,<br/>Bank of Unique Ideas Team</p>
    `;

    console.log('[NDA APPROVE] Sending email via Resend to', investorEmail);

    // 5) Send email
    const { data, error } = await resend.emails.send({
      from,
      to: investorEmail,
      subject,
      html,
    });

    if (error) {
      console.error('[NDA APPROVE] Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send approval email', detail: error },
        { status: 500 }
      );
    }

    console.log('[NDA APPROVE] Email sent successfully. Resend data:', data);

    // 6) Success response
    return NextResponse.json({
      ok: true,
      message: 'NDA approved and email sent.',
      resendId: (data as any)?.id ?? null,
    });
  } catch (err: any) {
    console.error('[NDA APPROVE] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Unexpected server error.', detail: err?.message },
      { status: 500 }
    );
  }
}