'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

type NdaRow = {
  id: string;
  idea_id: string;
  user_id: string;
  email: string | null;
  status: string | null;
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

  // 🔹 THIS IS THE PART WE FIXED
  async function handleDecision(
    row: NdaRow,
    decision: 'approved' | 'rejected'
  ) {
    setErr(null);

    try {
      // 1) Compute access window if approved
      const unblurUntil =
        decision === 'approved'
          ? new Date(
              Date.now() + ACCESS_DAYS * 24 * 60 * 60 * 1000
            ).toISOString()
          : null;

      // 2) Update NDA row in DB
      const { error } = await supabase
        .from('nda_requests')
        .update({
          status: decision,
          unblur_until: unblurUntil,
        })
        .eq('id', row.id);

      if (error) throw error;

      // 3) Optimistic UI update
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? { ...r, status: decision, unblur_until: unblurUntil }
            : r
        )
      );

      // 4) If no email on row, nothing to send
      if (!row.email) {
        return;
      }

      // 5) Build email content
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

      let subject: string;
      let html: string;

      if (decision === 'approved') {
        // Investor will open this page to download + upload NDA
        const ndaLink = `${siteUrl}/nda/${row.id}`;

        subject = `NDA approved – ${row.idea_title || 'idea'}`;
        html = `
          <p>Dear ${row.investor_name || 'Investor'},</p>
          <p>Your NDA request for <strong>${
            row.idea_title || 'our idea'
          }</strong> has been approved.</p>
          <p>Please click the link below to download and sign the NDA, then upload the signed copy:</p>
          <p><a href="${ndaLink}">${ndaLink}</a></p>
          ${
            unblurUntil
              ? `<p>Once the signed NDA is received and confirmed, we will grant you access to the full idea brief.</p>`
              : ''
          }
          <p>Best regards,<br/>Bank of Unique Ideas</p>
        `;
      } else {
        subject = `NDA request not approved – ${row.idea_title || 'idea'}`;
        html = `
          <p>Dear ${row.investor_name || 'Investor'},</p>
          <p>Your NDA request for <strong>${
            row.idea_title || 'our idea'
          }</strong> was not approved at this time.</p>
          <p>You may contact us if you need more information.</p>
          <p>Best regards,<br/>Bank of Unique Ideas</p>
        `;
      }

      // 6) Call email API route
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: row.email,
          subject,
          html,
        }),
      });
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Failed to update NDA request.');
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white px-6 pt-24 pb-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-emerald-300">
            NDA Requests (Admin)
          </h1>
        </div>

        {err && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">
            {err}
          </div>
        )}

        {loading && <p className="text-white/70">Loading NDA requests…</p>}

        {!loading && rows.length === 0 && (
          <p className="text-white/60">No NDA requests yet.</p>
        )}

        {!loading && rows.length > 0 && (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 p-4"
              >
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">
                    {row.idea_title || 'Untitled idea'}
                  </p>
                  <p className="text-white/70">
                    Investor: {row.investor_name || 'Unknown'} — {row.email}
                  </p>
                  <p className="text-xs text-white/50">
                    Requested:{' '}
                    {row.created_at
                      ? new Date(row.created_at).toLocaleString()
                      : '—'}
                  </p>
                  <p className="text-xs text-white/60">
                    Status:{' '}
                    <span className="font-semibold">
                      {row.status || 'requested'}
                    </span>
                    {row.status === 'approved' && row.unblur_until && (
                      <>
                        {' '}
                        — active until{' '}
                        {new Date(row.unblur_until).toLocaleString()}
                      </>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => handleDecision(row, 'approved')}
                    className="rounded-full bg-emerald-400 px-3 py-1.5 font-semibold text-black hover:bg-emerald-300"
                  >
                    Approve ({ACCESS_DAYS} days)
                  </button>
                  <button
                    onClick={() => handleDecision(row, 'rejected')}
                    className="rounded-full bg-rose-500/90 px-3 py-1.5 font-semibold text-white hover:bg-rose-400"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}