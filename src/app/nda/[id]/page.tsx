import { createClient } from '@supabase/supabase-js';

export default async function NDAPage({ params }: { params: { id: string } }) {
  // ✅ Correctly read the UUID from /nda/<id>
  const ndaId = params?.id;

  // Guard: show a friendly message instead of crashing DB with "undefined"
  if (!ndaId) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Invalid NDA link</h2>
        <p>NDA ID is missing from the URL.</p>
      </div>
    );
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Server config error</h2>
        <p>
          Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      </div>
    );
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await sb
    .from('nda_requests')
    .select('id,status,email,investor_email,unblur_until,idea_id')
    .eq('id', ndaId)
    .maybeSingle();

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Error loading NDA</h2>
        <p>{error.message}</p>
        <p>
          <b>NDA ID:</b> {ndaId}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 24 }}>
        <h2>NDA not found</h2>
        <p>This NDA link is invalid or the request does not exist.</p>
        <p>
          <b>NDA ID:</b> {ndaId}
        </p>
      </div>
    );
  }

  const investorEmail = data.email ?? data.investor_email ?? '—';

  return (
    <div style={{ padding: 24 }}>
      <h1>NDA Request</h1>
      <p>
        <b>ID:</b> {data.id}
      </p>
      <p>
        <b>Status:</b> {data.status}
      </p>
      <p>
        <b>Investor Email:</b> {investorEmail}
      </p>
      <p>
        <b>Unblur Until:</b>{' '}
        {data.unblur_until ? String(data.unblur_until) : '—'}
      </p>

      <hr style={{ margin: '20px 0' }} />

      <p>Next step: show NDA PDF download + upload signed NDA.</p>
    </div>
  );
}
