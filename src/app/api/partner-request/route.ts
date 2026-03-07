import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

async function maybeSendEmail(subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.PARTNER_NOTIFY_EMAIL;
  if (!key || !to) return;

  // Resend API (optional)
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'GlobUI <no-reply@globui.com>',
      to: [to],
      subject,
      html,
    }),
  }).catch(() => {});
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Payload>;

    const orgName = (body.orgName ?? '').trim();
    const orgType = (body.orgType ?? '').trim();
    const partnershipType = (body.partnershipType ?? '').trim();
    const contactName = (body.contactName ?? '').trim();
    const contactEmail = (body.contactEmail ?? '').trim();
    const contactPhone = (body.contactPhone ?? '').trim() || null;
    const country = (body.country ?? '').trim() || null;
    const website = (body.website ?? '').trim() || null;
    const message = (body.message ?? '').trim() || null;

    if (!orgName || !orgType || !partnershipType || !contactName || !contactEmail) {
      return NextResponse.json({ ok: false, error: 'Please fill all required fields.' }, { status: 400 });
    }
    if (!isEmail(contactEmail)) {
      return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('partner_requests')
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
        status: 'new',
      })
      .select('id, created_at')
      .single();

    if (error) throw error;

    // Optional email notification
    await maybeSendEmail(
      `New GlobUI Partnership Request (${orgName})`,
      `
        <div style="font-family:Arial,sans-serif">
          <h2>New Partnership Request</h2>
          <p><b>Org:</b> ${orgName}</p>
          <p><b>Type:</b> ${orgType}</p>
          <p><b>Partnership:</b> ${partnershipType}</p>
          <p><b>Contact:</b> ${contactName} (${contactEmail})</p>
          ${contactPhone ? `<p><b>Phone:</b> ${contactPhone}</p>` : ''}
          ${country ? `<p><b>Country:</b> ${country}</p>` : ''}
          ${website ? `<p><b>Website:</b> ${website}</p>` : ''}
          ${message ? `<p><b>Message:</b><br/>${message.replace(/\n/g, '<br/>')}</p>` : ''}
          <p><b>ID:</b> ${data.id}</p>
        </div>
      `
    );

    return NextResponse.json({ ok: true, id: data.id });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to submit request.' }, { status: 500 });
  }
}