import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ideaId, userId, email } = body;

    if (!ideaId || !userId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // prevent duplicate
    const { data: existing } = await supabase
      .from('nda_requests')
      .select('id')
      .eq('idea_id', ideaId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        ok: true,
        message: 'NDA request already exists. Admin will review it.',
      });
    }

    const { error } = await supabase.from('nda_requests').insert({
      idea_id: ideaId,
      user_id: userId,
      email,
      investor_email: email,
      status: 'requested',
    });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      message: 'NDA request sent. Admin will review it.',
    });
  }catch (e: any) {
  console.error('[API] NDA error:', e);

  // Helpful if it's a Supabase/Postgres error
  const details =
    e?.message || e?.details || e?.hint || JSON.stringify(e, null, 2);

  return NextResponse.json(
    { error: 'Internal server error', details },
    { status: 500 }
  );
}
  }
