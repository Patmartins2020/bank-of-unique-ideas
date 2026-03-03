import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY');
  return new Stripe(key, );
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!service) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, service, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    const supabase = getSupabaseAdmin();

    const sig = req.headers.get('stripe-signature');
    const whsec = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig) {
      return NextResponse.json({ ok: false, error: 'Missing stripe-signature' }, { status: 400 });
    }
    if (!whsec) {
      return NextResponse.json({ ok: false, error: 'Missing STRIPE_WEBHOOK_SECRET' }, { status: 500 });
    }

    // IMPORTANT: raw body
    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, whsec);
    } catch (e: any) {
      console.error('[webhook] signature verify failed:', e?.message);
      return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 400 });
    }

    // Handle event(s)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const ideaId = session.metadata?.ideaId;

      if (!ideaId) {
        return NextResponse.json({ ok: true, note: 'No ideaId in metadata' });
      }

      // read idea to know what options were requested
      const { data: idea } = await supabase
        .from('ideas')
        .select('id, feature_requested, ppa_requested, payment_status')
        .eq('id', ideaId)
        .maybeSingle();

      // feature expires in 30 days (only if requested)
      const featureExpiresAt =
        idea?.feature_requested ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;

      await supabase
        .from('ideas')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          deposited_at: new Date().toISOString(),
          feature_paid: Boolean(idea?.feature_requested),
          feature_expires_at: featureExpiresAt,
          ppa_requested: Boolean(idea?.ppa_requested), // keep as is (already stored)
        })
        .eq('id', ideaId);
    }

    // You can add other events later if needed:
    // - 'checkout.session.expired'
    // - 'payment_intent.payment_failed'

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[webhook] error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Webhook error' },
      { status: 500 }
    );
  }
}