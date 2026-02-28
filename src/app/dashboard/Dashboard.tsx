'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type DashboardProps = { adminEmail: string };
type AnyRow = Record<string, any>;

type IdeaStatus = 'pending' | 'viewed' | 'confirmed' | 'blocked' | string;

type NdaAction =
  | 'send_nda_link'
  | 'reject_request'
  | 'approve_signed'
  | 'block_request';

type InquiryStatus = 'new' | 'contacted' | 'closed' | string;

type ActiveTab = 'ideas' | 'users' | 'nda' | 'inquiries';

type InquiryRow = {
  id: string;
  idea_id: string;
  investor_id: string | null;
  investor_email: string | null;
  investor_name: string | null;
  message: string | null;
  status: InquiryStatus | null;
  created_at: string | null;
  updated_at: string | null;
  contacted_at: string | null;
  closed_at: string | null;
};

type IdeaMini = { id: string; title: string | null; category: string | null };

export default function Dashboard({ adminEmail }: DashboardProps) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [ideas, setIdeas] = useState<AnyRow[]>([]);
  const [profiles, setProfiles] = useState<AnyRow[]>([]);
  const [ndaRequests, setNdaRequests] = useState<AnyRow[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [ideasById, setIdeasById] = useState<Record<string, IdeaMini>>({});

  const [activeTab, setActiveTab] = useState<ActiveTab>('nda');
  const [loading, setLoading] = useState<boolean>(true);

  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [busyNdaId, setBusyNdaId] = useState<string | null>(null);
  const [busyInquiryId, setBusyInquiryId] = useState<string | null>(null);
  const [busyDeleteKey, setBusyDeleteKey] = useState<string | null>(null);

  // ---------------- helpers ----------------
  const getInvestorEmail = useCallback((r: AnyRow) => {
    return r?.investor_email || r?.email || '—';
  }, []);

  const hasSignedUpload = useCallback((r: AnyRow) => {
    return Boolean(r?.signed_nda_url || r?.signed_nda_path || r?.signed_file_path);
  }, []);

  const fmt = useCallback((v: any) => {
    if (!v) return '—';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
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

    try {
      const [
        { data: ideasData, error: ideasError },
        { data: profs, error: profsError },
        { data: nda, error: ndaError },
        { data: inq, error: inqError },
      ] = await Promise.all([
        supabase.from('ideas').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('nda_requests').select('*').order('created_at', { ascending: false }),
        supabase
          .from('investor_inquiries')
          .select(
            'id, idea_id, investor_id, investor_email, investor_name, message, status, created_at, updated_at, contacted_at, closed_at'
          )
          .order('created_at', { ascending: false }),
      ]);

      if (ideasError) throw new Error('Ideas Error: ' + ideasError.message);
      if (profsError) throw new Error('Profiles Error: ' + profsError.message);
      if (ndaError) throw new Error('NDA Error: ' + ndaError.message);
      if (inqError) throw new Error('Investor Inquiries Error: ' + inqError.message);

      const ideasArr = ideasData ?? [];
      setIdeas(ideasArr);
      setProfiles(profs ?? []);
      setNdaRequests(nda ?? []);
      setInquiries((inq ?? []) as InquiryRow[]);

      // quick lookup for inquiry idea titles
      const map: Record<string, IdeaMini> = {};
      for (const it of ideasArr) {
        if (it?.id) map[it.id] = { id: it.id, title: it.title ?? null, category: it.category ?? null };
      }
      setIdeasById(map);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
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

  const inquiriesCount = inquiries.length;
  const newInquiriesCount = useMemo(() => {
    return inquiries.reduce((acc, r) => ((r.status ?? 'new') === 'new' ? acc + 1 : acc), 0);
  }, [inquiries]);

  // ---------------- NDA actions (UNCHANGED) ----------------
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

      if (action === 'block_request') {
        const ok = window.confirm('Block this investor/request? This will email the investor and prevent access.');
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
          setToast(data?.emailSent ? '✅ Blocking email sent.' : '✅ Blocked. Email was skipped/failed.');
        } else if (action === 'approve_signed') {
          setToast(
            data?.emailSent
              ? '✅ Access granted (48h). Access link emailed to investor.'
              : '✅ Access granted (48h). Email was skipped/failed.'
          );
        } else if (action === 'reject_request') {
          setToast(data?.emailSent ? '✅ Rejection email sent.' : '✅ Rejected. Email was skipped/failed.');
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

  // ---------------- Inquiry actions ----------------
  const setInquiryStatus = useCallback(
    async (row: InquiryRow, next: InquiryStatus) => {
      if (!row?.id) return;

      try {
        setBusyInquiryId(row.id);
        setError(null);
        setToast(null);

        const patch: Partial<InquiryRow> = { status: next };
        if (next === 'contacted') patch.contacted_at = new Date().toISOString();
        if (next === 'closed') patch.closed_at = new Date().toISOString();

        const { error: upErr } = await supabase
          .from('investor_inquiries')
          .update(patch)
          .eq('id', row.id);

        if (upErr) throw upErr;

        setToast(`✅ Inquiry marked as ${next}.`);
        await loadAll();
      } catch (e: any) {
        console.error(e);
        setError(e?.message || 'Failed to update inquiry.');
      } finally {
        setBusyInquiryId(null);
      }
    },
    [supabase, loadAll]
  );

  // ---------------- Delete actions ----------------
 // ---------------- Delete actions ----------------

// Delete NDA request (via RPC – required because of RLS)
const deleteNdaRow = useCallback(
  async (ndaId: string) => {
    const ok = window.confirm(
      'Delete this NDA request?\n\nThis action cannot be undone.'
    );
    if (!ok) return;

    const key = `nda:${ndaId}`;

    try {
      setBusyDeleteKey(key);
      setError(null);
      setToast(null);

      // IMPORTANT: admin_delete_nda must exist and allow the current admin
      const { error } = await supabase.rpc('admin_delete_nda', { nda_id: ndaId });
      if (error) throw error;

      setToast('✅ NDA request deleted successfully.');
      await loadAll();
    } catch (e: any) {
      console.error('[DELETE NDA]', e);
      setError(e?.message || 'Failed to delete NDA request.');
    } finally {
      setBusyDeleteKey(null);
    }
  },
  [supabase, loadAll]
);

const deleteInquiryRow = useCallback(
  async (inqId: string) => {
    const ok = window.confirm(
      'Delete this investor inquiry?\n\nThis action cannot be undone.'
    );
    if (!ok) return;

    const key = `inq:${inqId}`;

    try {
      setBusyDeleteKey(key);
      setError(null);
      setToast(null);

      const { error } = await supabase
        .from('investor_inquiries')
        .delete()
        .eq('id', inqId);

      if (error) throw error;

      setToast('✅ Inquiry deleted successfully.');
      await loadAll();
    } catch (e: any) {
      console.error('[DELETE INQUIRY]', e);
      setError(e?.message || 'Failed to delete inquiry.');
    } finally {
      setBusyDeleteKey(null);
    }
  },
  [supabase, loadAll]
);

// ---------------- UI ----------------
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
      <div className="flex flex-wrap gap-4 border-b border-white/10 mb-6">
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

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`pb-2 text-sm flex items-center gap-2 ${
            activeTab === 'inquiries'
              ? 'border-b-2 border-emerald-400 text-emerald-300'
              : 'text-white/60'
          }`}
        >
          <span>Investor Inquiries</span>
          <span className="text-[11px] rounded-full px-2 py-0.5 bg-white/10 text-white/80">
            {inquiriesCount}
          </span>
          <span className="text-[11px] rounded-full px-2 py-0.5 bg-emerald-500/15 text-emerald-200">
            new: {newInquiriesCount}
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
                    const delBusy = busyDeleteKey === `nda:${r.id}`;

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
                            >
                              Uploaded
                            </button>
                          ) : (
                            <span className="text-[11px] text-white/40 italic">No NDA uploaded</span>
                          )}
                        </td>

                        <td className="px-3 py-2 border border-white/10 text-xs">
                          {fmt(r.unblur_until)}
                        </td>

                        <td className="px-3 py-2 border border-white/10">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => runNdaAction(r, 'send_nda_link')}
                              disabled={disabled || delBusy}
                              className="text-[11px] px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                            >
                              {disabled ? 'Working…' : 'Send NDA link'}
                            </button>

                            <button
                              onClick={() => runNdaAction(r, 'approve_signed')}
                              disabled={disabled || delBusy || !signed}
                              className={`text-[11px] px-2 py-1 rounded disabled:opacity-50 ${
                                signed ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gray-600'
                              }`}
                            >
                              Approve signed
                            </button>

                            <button
                              onClick={() => runNdaAction(r, 'block_request')}
                              disabled={disabled || delBusy}
                              className="text-[11px] px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50"
                            >
                              Block
                            </button>

                            <button
                              onClick={() => runNdaAction(r, 'reject_request')}
                              disabled={disabled || delBusy}
                              className="text-[11px] px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-50"
                            >
                              Reject
                            </button>

                            <button
                              onClick={() => deleteNdaRow(r.id)}
                              disabled={disabled || delBusy}
                              className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
                            >
                              {delBusy ? 'Deleting…' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* INVESTOR INQUIRIES TAB */}
      {activeTab === 'inquiries' && (
        <section>
          {inquiries.length === 0 && !loading && !error && (
            <p className="text-sm text-white/60">No investor inquiries yet.</p>
          )}

          {inquiries.length > 0 && (
            <div className="overflow-x-auto text-sm">
              <table className="w-full border-collapse border border-white/10 text-left">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-3 py-2 border border-white/10">Created</th>
                    <th className="px-3 py-2 border border-white/10">Idea</th>
                    <th className="px-3 py-2 border border-white/10">Investor</th>
                    <th className="px-3 py-2 border border-white/10">Status</th>
                    <th className="px-3 py-2 border border-white/10">Message</th>
                    <th className="px-3 py-2 border border-white/10">Contacted</th>
                    <th className="px-3 py-2 border border-white/10">Closed</th>
                    <th className="px-3 py-2 border border-white/10">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {inquiries.map((r) => {
                    const disabled = busyInquiryId === r.id;
                    const delBusy = busyDeleteKey === `inq:${r.id}`;
                    const idea = ideasById[r.idea_id];
                    const status = (r.status ?? 'new') as InquiryStatus;

                    return (
                      <tr key={r.id}>
                        <td className="px-3 py-2 border border-white/10 text-xs">{fmt(r.created_at)}</td>

                        <td className="px-3 py-2 border border-white/10">
                          <div className="font-semibold">{idea?.title ?? '—'}</div>
                          <div className="text-[11px] text-white/50 font-mono">{r.idea_id}</div>
                        </td>

                        <td className="px-3 py-2 border border-white/10">
                          <div>{r.investor_name ?? '—'}</div>
                          <div className="text-[12px] text-white/70">{r.investor_email ?? '—'}</div>
                        </td>

                        <td className="px-3 py-2 border border-white/10">{status}</td>

                        <td className="px-3 py-2 border border-white/10">
                          <div className="max-w-[420px] whitespace-pre-wrap text-white/80">
                            {r.message ?? '—'}
                          </div>
                        </td>

                        <td className="px-3 py-2 border border-white/10 text-xs">{fmt(r.contacted_at)}</td>
                        <td className="px-3 py-2 border border-white/10 text-xs">{fmt(r.closed_at)}</td>

                        <td className="px-3 py-2 border border-white/10">
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={r.investor_email ? `mailto:${encodeURIComponent(r.investor_email)}` : undefined}
                              className={`text-[11px] px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 ${
                                r.investor_email ? '' : 'opacity-50 pointer-events-none'
                              }`}
                            >
                              Email
                            </a>

                            <button
                              onClick={() => setInquiryStatus(r, 'contacted')}
                              disabled={disabled || delBusy || status === 'contacted' || status === 'closed'}
                              className="text-[11px] px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
                            >
                              Mark contacted
                            </button>

                            <button
                              onClick={() => setInquiryStatus(r, 'closed')}
                              disabled={disabled || delBusy || status === 'closed'}
                              className="text-[11px] px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-50"
                            >
                              Close
                            </button>

                            <button
                              onClick={() => deleteInquiryRow(r.id)}
                              disabled={disabled || delBusy}
                              className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
                            >
                              {delBusy ? 'Deleting…' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Keep your existing IDEAS and USERS sections here (not touched) */}
    </div>
  </main>
  );
}