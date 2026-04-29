import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, );

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { ideaId } = await req.json();

    if (!ideaId) {
      return NextResponse.json(
        { ok: false, error: 'Missing ideaId' },
        { status: 400 }
      );
    }

    const { data: idea, error } = await supabase
      .from('ideas')
      .select('id, title')
      .eq('id', ideaId)
      .single();

    if (error || !idea) {
      return NextResponse.json(
        { ok: false, error: 'Idea not found' },
        { status: 404 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Idea Deposit: ${idea.title}`,
            },
            unit_amount: 199,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/submit/success?ideaId=${idea.id}`,
      cancel_url: `${baseUrl}/submit?cancelled=1`,
      metadata: {
        ideaId: idea.id,
      },
    });

    await supabase
      .from('ideas')
      .update({
        checkout_session_id: session.id,
        payment_status: 'requires_payment',
      })
      .eq('id', idea.id);

    return NextResponse.json({
      ok: true,
      url: session.url,
    });
  } catch (error: any) {
    console.error('STRIPE CHECKOUT ERROR:', error);

    return NextResponse.json(
      {
        ok: false,
        error: error.message || 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}