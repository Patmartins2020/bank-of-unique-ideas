import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs'; // Stripe needs Node runtime (not Edge)

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY');
  return new Stripe(key,);
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!service) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, service, { auth: { persistSession: false } });
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

export async function POST(req: Request) {
  try {
    const { ideaId } = await req.json();

    if (!ideaId) {
      return NextResponse.json({ ok: false, error: 'Missing ideaId' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const stripe = getStripe();

    // 1) Fetch idea
    const { data: idea, error } = await supabase
      .from('ideas')
      .select(
        'id, title, payment_status, feature_requested, ppa_requested, checkout_session_id'
      )
      .eq('id', ideaId)
      .maybeSingle();

    if (error || !idea) {
      return NextResponse.json({ ok: false, error: 'Idea not found' }, { status: 404 });
    }

    // 2) Prevent double payment
    if (idea.payment_status === 'paid') {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    // 3) Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'usd',
          unit_amount: 199, // $1.99 base submission
          product_data: { name: 'Idea Submission' },
        },
        quantity: 1,
      },
    ];

    if (idea.feature_requested) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          unit_amount: 1900, // $19.00
          product_data: { name: 'Homepage Feature (30 days)' },
        },
        quantity: 1,
      });
    }

    if (idea.ppa_requested) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          unit_amount: 19900, // $199.00
          product_data: { name: 'PPA Filing Assistance' },
        },
        quantity: 1,
      });
    }

    // 4) Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${siteUrl()}/submit/success?idea=${encodeURIComponent(ideaId)}`,
      cancel_url: `${siteUrl()}/submit?cancelled=1`,
      metadata: { ideaId },
    });

    // 5) Save session id + mark requires_payment
    await supabase
      .from('ideas')
      .update({
        checkout_session_id: session.id,
        payment_status: 'requires_payment',
      })
      .eq('id', ideaId);

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err: any) {
    console.error('[checkout]', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Stripe checkout error' },
      { status: 500 }
    );
  }
}