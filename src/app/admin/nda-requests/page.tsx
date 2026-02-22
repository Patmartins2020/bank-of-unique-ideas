'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { NDAStatus } from '@/lib/types';

type NdaRow = {
  id: string;
  idea_id: string;
  user_id: string;
  email: string | null;
  status: NDAStatus | null;
  created_at: string | null;
  unblur_until: string | null;
  idea_title?: string | null;
  investor_name?: string | null;
};

const ACCESS_DAYS = 7; // time-limited access window

export default function AdminNdaRequestsPage() {
  const router = useRouter();

  const [rows, setRows] = useState<NdaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        // 1) Check logged-in user
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.warn('admin/nda-requests getUser error:', error);
        }

        const user = data?.user ?? null;

        if (!user) {
          router.replace('/login');
          return;
        }

        // 2) Check if this user is admin
        const adminEmail =
          process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'patmartinsbest@gmail.com';

        let isAdmin = user.email === adminEmail;

        if (!isAdmin) {
          // fall back to profiles.role if available
          const { data: prof, error: profErr } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          if (profErr) {
            console.warn('admin/nda-requests profile error:', profErr);
          }

          if (prof && prof.role === 'admin') {
            isAdmin = true;
          }
        }

        if (!isAdmin) {
          router.replace('/');
          return;
        }

        // 3) Load NDA requests with idea & investor info
        const { data: ndaData, error: ndaErr } = await supabase
          .from('nda_requests')
          .select(
            `
              id,
              idea_id,
              user_id,
              email,
              status,
              created_at,
              unblur_until,
              idea:ideas ( title ),
              investor:profiles ( full_name )
            `
          )
          .order('created_at', { ascending: false });

        if (ndaErr) throw ndaErr;

        if (!cancelled) {
          const mapped: NdaRow[] =
            (ndaData || []).map((row: any) => ({
              id: row.id,
              idea_id: row.idea_id,
              user_id: row.user_id,
              email: row.email,
              status: row.status,
              created_at: row.created_at,
              unblur_until: row.unblur_until,
              idea_title: row.idea?.title ?? null,
              investor_name: row.investor?.full_name ?? null,
            })) ?? [];

          setRows(mapped);
        }
      } catch (e: any) {
        console.error(e);
        if (!cancelled) setErr(e?.message || 'Failed to load NDA requests.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleDecision(
    row: NdaRow,
    decision: 'confirmed' | 'blocked' 
  ) {
    alert('Approve button click reached handleDecision');
    console.log('[NDA] 1 - handled decision function called with:', {
      row,
      decision,
    });
    setErr(null);

    // 1) Compute access window if confirmed
    const unblurUntil =
      decision === 'confirmed'
        ? new Date(Date.now() + ACCESS_DAYS * 24 * 60 * 60 * 1000).toISOString()
        : null;

// 2) Try to update NDA row in DB (but DO NOT stop if it fails)
try {
  console.log('[NDA] updating nda_requests...', {
    id: row.id,
    decision,
    unblurUntil,
  });

  const { error } = await supabase
    .from('nda_requests')
    .update({
      status: decision,
      unblur_until: unblurUntil,
    })
    .eq('id', row.id);

  if (error) {
    console.error('[NDA] Supabase update error:', error);
    setErr(error.message ?? 'Failed to update NDA in database.');
  } else {
    console.log('[NDA] Supabase update OK');

    // Optimistic UI update only when DB update succeeds
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? {
              ...r,
              status: decision as NDAStatus,
              unblur_until: unblurUntil,
            }
          : r
      )
    );
  }
} catch (dbErr: any) {
  console.error('[NDA] Unexpected Supabase error:', dbErr);
  setErr(dbErr?.message ?? 'Unexpected error updating NDA record.');
  return; // stop here if DB update failed
}

// 3) If no email on row, nothing more to do
if (!row.email) {
  console.warn('[NDA] No email on NDA row, skipping email send');
  return;
}

// 4) Call our dedicated email API: /api/nda/approve (for both approve & reject)
try {
  const payload = {
    ndaId: row.id,
    investorEmail: row.email,
    investorName: row.investor_name ?? null,
    ideaTitle: row.idea_title ?? null,
    decision: decision as NDAStatus,
    unblurUntil,
  };

  console.log('[NDA] calling /api/nda/approve with:', payload);

  const res = await fetch('/api/nda/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log('[NDA] /api/nda/approve response:', res.status, text);

  if (!res.ok) {
    throw new Error(`Email send failed with status ${res.status}: ${text || 'no body returned'}`);
  }
} catch (emailErr: any) {
  console.error('[NDA] Email send error:', emailErr);
  setErr(emailErr?.message ?? 'Failed to send NDA email.');
}
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>NDA Requests</h1>
      {loading && <p>Loading...</p>}
      {err && <p style={{ color: 'red' }}>Error: {err}</p>}
      {!loading && rows.length === 0 && <p>No NDA requests found.</p>}
      {!loading && rows.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Investor</th>
              <th>Email</th>
              <th>Idea</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.investor_name || 'N/A'}</td>
                <td>{row.email || 'N/A'}</td>
                <td>{row.idea_title || 'N/A'}</td>
                <td>{row.status || 'pending'}</td>
                <td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <button onClick={() => handleDecision(row, 'confirmed')}>Approve</button>
                  <button onClick={() => handleDecision(row, 'blocked')}>Block</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}