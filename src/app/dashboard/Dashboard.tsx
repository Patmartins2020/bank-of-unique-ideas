'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

type DashboardProps = { adminEmail: string };
type AnyRow = Record<string, any>;
type IdeaStatus = 'pending' | 'viewed' | 'confirmed' | 'blocked' | string;
type NdaAction = 'send_nda_link' | 'reject_request' | 'approve_signed' | 'block_request';
type ActiveTab = 'ideas' | 'users' | 'nda';

export default function Dashboard({ adminEmail }: DashboardProps) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [ideas, setIdeas] = useState<AnyRow[]>([]);
  const [profiles, setProfiles] = useState<AnyRow[]>([]);
  const [ndaRequests, setNdaRequests] = useState<AnyRow[]>([]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('ideas');
  const [loading, setLoading] = useState<boolean>(true);

  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [busyNdaId, setBusyNdaId] = useState<string | null>(null);

  // ---------------- helpers ----------------
  const getInvestorEmail = useCallback((r: AnyRow) => {
    return r?.investor_email || r?.email || '—';
  }, []);

  const hasSignedUpload = useCallback((r: AnyRow) => {
    return Boolean(r?.signed_nda_url || r?.signed_nda_path || r?.signed_file_path);
  }, []);

  // Open signed NDA (works for both public URL or private bucket via signed URL API)
  const openSignedNda = useCallback(async (ndaId: string) => {
    try {
      setError(null);

      const res = await fetch(`/api/nda/signed-url?ndaId=${encodeURIComponent(ndaId)}`);
      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || !data?.ok || !data?.url) {
        alert(data?.error || 'Could not open signed NDA.');
        return;
      }

      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch {
      alert('Failed to open signed NDA.');
    }
  }, []);

  // ---------------- load data ----------------
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: ideasData, error: ideasError } = await supabase
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false });

    if (ideasError) {
      console.error('Ideas error:', ideasError);
      setError('Ideas Error: ' + ideasError.message);
      setLoading(false);
      return;
    }

    const { data: profs, error: profsError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profsError) {
      console.error('Profiles error:', profsError);
      setError('Profiles Error: ' + profsError.message);
      setLoading(false);
      return;
    }

    const { data: nda, error: ndaError } = await supabase
      .from('nda_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (ndaError) {
      console.error('NDA error:', ndaError);
      setError('NDA Error: ' + ndaError.message);
      setLoading(false);
      return;
    }

    setIdeas(ideasData ?? []);
    setProfiles(profs ?? []);
    setNdaRequests(nda ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mounted) return;
      await loadAll();
    })();

    return () => {
      mounted = false;
    };
  }, [loadAll]);

  // ---------------- counts ----------------
  const pendingIdeasCount = useMemo(() => {
    return ideas.reduce((acc, idea) => {
      const status: IdeaStatus = idea.status ?? 'pending';
      return status === 'pending' ? acc + 1 : acc;
    }, 0);
  }, [ideas]);

  const usersCount = profiles.length;
  const ndaCount = ndaRequests.length;

  // ---------------- NDA actions ----------------
  const runNdaAction = useCallback(
    async (row: AnyRow, action: NdaAction) => {
      if (!row?.id) {
        setError('Invalid NDA request row.');
        return;
      }

      if (action === 'reject_request') {
        const ok = window.confirm('Reject this NDA request? This will email the investor.');
        if (!ok) return;
      }

      try {
        setBusyNdaId(row.id);
        setError(null);
        setToast(null);

        const res = await fetch('/api/nda/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ndaId: row.id, action }),
        });

        const data = await res.json().catch(() => ({} as any));

        if (!res.ok) {
          setError(data?.error || 'Failed to process NDA action.');
          return;
        }

        if (action === 'send_nda_link') {
          setToast(
            data?.emailSent
              ? '✅ NDA link sent to investor.'
              : '✅ Status updated. Email was skipped/failed (check RESEND_API_KEY).'
          );
        } else if (action === 'block_request') {
          setToast(
            data?.emailSent ? '✅ Blocking email sent.' : '✅ Blocked. Email was skipped/failed.'
          );
        } else if (action === 'approve_signed') {
          setToast(
            data?.emailSent
              ? '✅ Access granted (48h). Access link emailed to investor.'
              : '✅ Access granted (48h). Email was skipped/failed.'
          );
        } else if (action === 'reject_request') {
          setToast(
            data?.emailSent ? '✅ Rejection email sent.' : '✅ Rejected. Email was skipped/failed.'
          );
        }

        await loadAll();
      } catch (e: any) {
        console.error(e);
        setError(e?.message || 'Unexpected error running NDA action.');
      } finally {
        setBusyNdaId(null);
      }
    },
    [loadAll]
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Admin Dashboard</h1>
            <p className="text-sm text-emerald-300">
              👑 Admin: <span className="font-mono">{adminEmail}</span>
            </p>
          </div>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/');
            }}
            className="text-xs px-3 py-1.5 rounded-md bg-rose-500 text-white hover:bg-rose-400 transition"
          >
            Log out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/10 mb-6">
          <button
            onClick={() => setActiveTab('ideas')}
            className={`pb-2 text-sm flex items-center gap-2 ${
              activeTab === 'ideas'
                ? 'border-b-2 border-emerald-400 text-emerald-300'
                : 'text-white/60'
            }`}
          >
            <span>Pending Ideas</span>
            <span className="text-[11px] rounded-full px-2 py-0.5 bg-white/10 text-white/80">
              {pendingIdeasCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2 text-sm flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-b-2 border-emerald-400 text-emerald-300'
                : 'text-white/60'
            }`}
          >
            <span>Users</span>
            <span className="text-[11px] rounded-full px-2 py-0.5 bg-white/10 text-white/80">
              {usersCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('nda')}
            className={`pb-2 text-sm flex items-center gap-2 ${
              activeTab === 'nda'
                ? 'border-b-2 border-emerald-400 text-emerald-300'
                : 'text-white/60'
            }`}
          >
            <span>NDA Requests</span>
            <span className="text-[11px] rounded-full px-2 py-0.5 bg-white/10 text-white/80">
              {ndaCount}
            </span>
          </button>
        </div>

        {loading && <p className="text-sm text-white/70 mb-4">Loading data…</p>}

        {toast && (
          <div className="mb-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-emerald-200 text-sm">
            {toast}
          </div>
        )}

        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        {/* NDA TAB */}
        {activeTab === 'nda' && (
          <section>
            {ndaRequests.length === 0 && !loading && !error && (
              <p className="text-sm text-white/60">No NDA requests yet.</p>
            )}

            {ndaRequests.length > 0 && (
              <div className="overflow-x-auto text-sm">
                <table className="w-full border-collapse border border-white/10 text-left">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-3 py-2 border border-white/10">ID</th>
                      <th className="px-3 py-2 border border-white/10">Idea ID</th>
                      <th className="px-3 py-2 border border-white/10">Investor</th>
                      <th className="px-3 py-2 border border-white/10">Status</th>
                      <th className="px-3 py-2 border border-white/10">Signed NDA</th>
                      <th className="px-3 py-2 border border-white/10">Access until</th>
                      <th className="px-3 py-2 border border-white/10">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {ndaRequests.map((r) => {
                      const signed = hasSignedUpload(r);
                      const disabled = busyNdaId === r.id;

                      return (
                        <tr key={r.id}>
                          <td className="px-3 py-2 border border-white/10 text-xs">{r.id}</td>

                          <td className="px-3 py-2 border border-white/10 text-xs">
                            {r.idea_id ?? '—'}
                          </td>

                          <td className="px-3 py-2 border border-white/10">{getInvestorEmail(r)}</td>

                          <td className="px-3 py-2 border border-white/10">
                            {r.status ?? 'pending'}
                          </td>

                          <td className="px-3 py-2 border border-white/10">
                            {/* If you stored a full signed_nda_url, use it. Otherwise show clickable Uploaded */}
                            {r.signed_nda_url ? (
                              <a
                                href={r.signed_nda_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] px-2 py-1 rounded bg-slate-600 hover:bg-slate-500"
                              >
                                View NDA
                              </a>
                            ) : signed ? (
                              <button
                                type="button"
                                onClick={() => openSignedNda(r.id)}
                                className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80"
                                title="Open uploaded signed NDA"
                              >
                                Uploaded
                              </button>
                            ) : (
                              <span className="text-[11px] text-white/40 italic">No NDA uploaded</span>
                            )}
                          </td>

                          <td className="px-3 py-2 border border-white/10 text-xs">
                            {r.unblur_until ? new Date(r.unblur_until).toLocaleString() : '—'}
                          </td>

                          <td className="px-3 py-2 border border-white/10">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => runNdaAction(r, 'send_nda_link')}
                                disabled={disabled}
                                className="text-[11px] px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                              >
                                {disabled ? 'Working…' : 'Send NDA link'}
                              </button>

                              <button
                                onClick={() => runNdaAction(r, 'approve_signed')}
                                disabled={disabled || !signed}
                                className={`text-[11px] px-2 py-1 rounded disabled:opacity-50 ${
                                  signed ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gray-600'
                                }`}
                                title={!signed ? 'Investor must upload signed NDA first' : ''}
                              >
                                Approve signed
                              </button>

                              <button
                                onClick={() => runNdaAction(r, 'reject_request')}
                                disabled={disabled}
                                className="text-[11px] px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>

                            {disabled && (
                              <div className="mt-2 text-[11px] text-white/50">Processing…</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="mt-3 text-xs text-white/50">
                  Tip: “Send NDA link” emails the upload page. “Approve signed” grants 48-hour access and emails the access link.
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}