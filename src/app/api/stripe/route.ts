import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { ideaId } = await req.json();

    if (!ideaId) {
      return NextResponse.json({ ok: false, error: 'Missing ideaId' }, { status: 400 });
    }

    // 1️⃣ Fetch idea
    const { data: idea, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', ideaId)
      .single();

    if (error || !idea) {
      return NextResponse.json({ ok: false, error: 'Idea not found' }, { status: 404 });
    }

    // 2️⃣ Prevent double payment
    if (idea.payment_status === 'paid') {
      return NextResponse.json({
        ok: true,
        alreadyPaid: true,
      });
    }

    // 3️⃣ Build line items dynamically
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    // Base submission
    lineItems.push({
      price_data: {
        currency: 'usd',
        unit_amount: 199,
        product_data: {
          name: 'Idea Submission',
        },
      },
      quantity: 1,
    });

    // Feature option
    if (idea.feature_requested) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          unit_amount: 1900,
          product_data: {
            name: 'Homepage Feature (30 days)',
          },
        },
        quantity: 1,
      });
    }

    // PPA option
    if (idea.ppa_requested) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          unit_amount: 19900,
          product_data: {
            name: 'PPA Filing Assistance',
          },
        },
        quantity: 1,
      });
    }

    // 4️⃣ Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?idea=${ideaId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/submit`,
      metadata: {
        ideaId,
      },
    });

    // 5️⃣ Save session ID
    await supabase
      .from('ideas')
      .update({
        checkout_session_id: session.id,
      })
      .eq('id', ideaId);

    return NextResponse.json({
      ok: true,
      url: session.url,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Stripe error' },
      { status: 500 }
    );
  }
}