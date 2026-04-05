import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ideaId } = body;

    if (!ideaId) {
      return NextResponse.json(
        { ok: false, error: 'Missing ideaId' },
        { status: 400 }
      );
    }

    // verify idea exists
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

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Idea Deposit: ${idea.title}`,
            },
            unit_amount: 199, // $1.99
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/submit/success?idea=${idea.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/submit?cancelled=1`,
      metadata: {
        ideaId: idea.id,
      },
    });

    // save checkout reference
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