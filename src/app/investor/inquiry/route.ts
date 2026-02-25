import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // 1️⃣ Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // 2️⃣ Parse body
    const body = await req.json();
    const { ideaId, message } = body;

    if (!ideaId || !message) {
      return NextResponse.json(
        { error: 'Missing ideaId or message' },
        { status: 400 }
      );
    }

    // 3️⃣ Get investor profile (optional name)
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    // 4️⃣ Insert inquiry
    const { error: insertError } = await supabase
      .from('investor_inquiries')
      .insert({
        idea_id: ideaId,
        investor_id: user.id,
        investor_email: user.email,
        investor_name: profile?.full_name ?? null,
        message,
        status: 'new',
      });

    if (insertError) {
      console.error(insertError);
      return NextResponse.json(
        { error: 'Failed to save inquiry' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}