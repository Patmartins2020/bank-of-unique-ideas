import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // 🔔 Handle successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const ideaId = session.metadata?.ideaId;

    if (!ideaId) {
      return NextResponse.json({ error: 'Missing ideaId metadata' }, { status: 400 });
    }

    const { data: idea } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', ideaId)
      .single();

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    const updatePayload: any = {
      payment_status: 'paid',
      paid_at: now,
      deposited_at: now,
    };

    // If homepage feature was requested
    if (idea.feature_requested) {
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);

      updatePayload.feature_paid = true;
      updatePayload.feature_expires_at = expires.toISOString();
    }

    await supabase
      .from('ideas')
      .update(updatePayload)
      .eq('id', ideaId);
  }

  return NextResponse.json({ received: true });
}