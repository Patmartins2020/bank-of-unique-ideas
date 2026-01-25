// src/app/api/nda/request/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function supabaseAdmin() {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;

  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

export async function GET(req: Request) {
  const sb = supabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { error: 'Server misconfigured: missing SUPABASE env vars.' },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Missing NDA request id' },
      { status: 400 },
    );
  }

  const { data, error } = await sb
    .from('nda_requests')
    .select('id,status,investor_email,signed_nda_path,created_at,unblur_until')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Invalid NDA request' }, { status: 404 });
  }

  return NextResponse.json({ nda: data });
}
