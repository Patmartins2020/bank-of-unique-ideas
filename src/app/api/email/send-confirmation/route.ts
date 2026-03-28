import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, name, ideaTitle } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const response = await resend.emails.send({
      from: 'Bank of Unique Ideas <noreply@bankofuniqueideas.com>',
      to: email,
      subject: '🎉 Your Idea Has Been Confirmed',
      html: `
        <h2>Congratulations ${name || ''} 🎉</h2>
        <p>Your idea "${ideaTitle || 'your submission'}" has been confirmed.</p>
        <a href="https://bankofuniqueideas.com/dashboard">Go to Dashboard</a>
      `,
    });

    return NextResponse.json({ ok: true, response });

  } catch (error: any) {
    console.error('EMAIL ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}