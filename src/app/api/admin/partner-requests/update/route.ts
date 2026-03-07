import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { id, status, adminNote } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ ok: false, error: 'Missing id/status' }, { status: 400 });
    }

    if (!['new', 'reviewing', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 });
    }

    const { error } = await supabase
      .from('partner_requests')
      .update({ status, admin_note: adminNote ?? null })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}