'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type DashboardProps = { adminEmail: string };

type AnyRow = Record<string, any>;
type IdeaStatus = 'pending' | 'viewed' | 'confirmed' | 'blocked' | string;

type NdaAction = 'send_nda_link' | 'reject_request' | 'approve_signed' | 'block_request';

type InquiryStatus = 'new' | 'contacted' | 'closed' | string;
type PartnerStatus = 'new' | 'reviewing' | 'approved' | 'rejected' | string;
type ActiveTab = 'ideas' | 'users' | 'nda' | 'inquiries' | 'partners';

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
  deleted_at?: string | null;
};

type PartnerRequestRow = {
  id: string;
  org_name: string;
  org_type: string;
  partnership_type: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  country: string | null;
  website: string | null;
  message: string | null;
  status: PartnerStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string | null;
};

type IdeaMini = { id: string; title: string | null; category: string | null };

export default function Dashboard({ adminEmail }: DashboardProps) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [ideas, setIdeas] = useState<AnyRow[]>([]);
  const [profiles, setProfiles] = useState<AnyRow[]>([]);
  const [ndaRequests, setNdaRequests] = useState<AnyRow[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [partnerRequests, setPartnerRequests] = useState<PartnerRequestRow[]>([]);
  const [ideasById, setIdeasById] = useState<Record<string, IdeaMini>>({});

  const [activeTab, setActiveTab] = useState<ActiveTab>('nda');
  const [loading, setLoading] = useState<boolean>(true);

  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [busyNdaId, setBusyNdaId] = useState<string | null>(null);
  const [busyInquiryId, setBusyInquiryId] = useState<string | null>(null);
  const [busyDeleteKey, setBusyDeleteKey] = useState<string | null>(null);
  const [busyIdeaId, setBusyIdeaId] = useState<string | null>(null);
  const [busyPartnerId, setBusyPartnerId] = useState<string | null>(null);

  const [partnerNotes, setPartnerNotes] = useState<Record<string, string>>({});

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
      const partnerReqPromise = fetch('/api/admin/partner-requests', {
        method: 'GET',
        cache: 'no-store',
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({} as any));
          if (!res.ok || !data?.ok) {
            throw new Error(data?.error || 'Partner Requests Error');
          }
          return (data.rows ?? []) as PartnerRequestRow[];
        });

      const [
        { data: ideasData, error: ideasError },
        { data: profs, error: profsError },
        { data: nda, error: ndaError },
        { data: inq, error: inqError },
        partnersData,
      ] = await Promise.all([
        supabase.from('ideas').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('nda_requests').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase
          .from('investor_inquiries')
          .select(
            'id, idea_id, investor_id, investor_email, investor_name, message, status, created_at, updated_at, contacted_at, closed_at, deleted_at'
          )
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
        partnerReqPromise,
      ]);

      if (ideasError) throw new Error('Ideas Error: ' + ideasError.message);
      if (profsError) throw new Error('Profiles Error: ' + profsError.message);
      if (ndaError) throw new Error('NDA Error: ' + ndaError.message);
      if (inqError) throw new Error('Investor Inquiries Error: ' + inqError.message);

      const ideasArr = ideasData ?? [];
      setIdeas(ideasArr);
      setProfiles(profs ?? []);
      setNdaRequests(nda ?? []);
      setInquiries(((inq ?? []) as InquiryRow[]) || []);
      setPartnerRequests(partnersData);

      const map: Record<string, IdeaMini> = {};
      for (const it of ideasArr) {
        if (it?.id) map[it.id] = { id: it.id, title: it.title ?? null, category: it.category ?? null };
      }
      setIdeasById(map);

      const noteMap: Record<string, string> = {};
      for (const p of partnersData) noteMap[p.id] = p.admin_note ?? '';
      setPartnerNotes(noteMap);
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
  const partnersCount = partnerRequests.length;

  const newInquiriesCount = useMemo(() => {
    return inquiries.reduce((acc, r) => ((r.status ?? 'new') === 'new' ? acc + 1 : acc), 0);
  }, [inquiries]);

  const newPartnersCount = useMemo(() => {
    return partnerRequests.reduce((acc, r) => ((r.status ?? 'new') === 'new' ? acc + 1 : acc), 0);
  }, [partnerRequests]);

  useEffect(() => {
  if (newPartnersCount > 0) {
    setToast(`🔔 ${newPartnersCount} new partnership request${newPartnersCount > 1 ? 's' : ''} received.`);
  }
}, [newPartnersCount]);
  // ---------------- ideas actions ----------------
  const setIdeaStatus = useCallback(
  async (ideaId: string, nextStatus: 'confirmed' | 'blocked') => {

    const label = nextStatus === 'confirmed' ? 'Confirm' : 'Block';

    const ok = window.confirm(
      `${label} this idea?\n\nThis will set status to "${nextStatus}".`
    );

    if (!ok) return;

    try {
      setBusyIdeaId(ideaId);
      setError(null);
      setToast(null);

      const { data, error } = await supabase
        .from('ideas')
        .update({
          status: nextStatus,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', ideaId)
        .select('*')
        .single();

      if (error) {
        console.error('Update failed:', error);
        setError(error.message);
        return;
      }

      console.log('Updated row:', data);

      setToast(
        nextStatus === 'confirmed'
          ? '✅ Idea confirmed.'
          : '🚫 Idea blocked.'
      );

      await loadAll(); // refresh UI

    } catch (e: any) {
      console.error('[IDEA STATUS]', e);
      setError(e?.message || 'Failed to update idea status.');
    } finally {
      setBusyIdeaId(null);
    }
  },
  [supabase, loadAll]
);
const deleteIdeaRow = useCallback(
  async (ideaId: string) => {
    const ok = window.confirm(
      'Delete this idea permanently?\n\nUse only for spam, duplicate test ideas, or corrupted rows.'
    );
    if (!ok) return;

    const key = `idea:${ideaId}`;

    try {
      setBusyDeleteKey(key);
      setError(null);
      setToast(null);

      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', ideaId);

      if (error) throw error;

      setToast('🗑️ Idea permanently deleted.');
      await loadAll();
    } catch (e: any) {
      console.error('[DELETE IDEA]', e);
      setError(e?.message || 'Failed to delete idea.');
    } finally {
      setBusyDeleteKey(null);
    }
  },
  [supabase, loadAll]
);
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
              ? '✅ Access granted (timed). Access link emailed to investor.'
              : '✅ Access granted (timed). Email was skipped/failed.'
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

  // ---------------- inquiry actions ----------------
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

        const { error: upErr } = await supabase.from('investor_inquiries').update(patch).eq('id', row.id);
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

  // ---------------- partner actions ----------------
  const updatePartnerStatus = useCallback(
    async (id: string, status: 'reviewing' | 'approved' | 'rejected') => {
      try {
        setBusyPartnerId(id);
        setError(null);
        setToast(null);

        const res = await fetch('/api/admin/partner-requests/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            status,
            adminNote: partnerNotes[id] ?? '',
          }),
        });

        const data = await res.json().catch(() => ({} as any));
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || 'Failed to update partnership request.');
        }

        setToast(
          status === 'approved'
            ? '✅ Partnership request approved.'
            : status === 'rejected'
            ? '✅ Partnership request rejected.'
            : '✅ Partnership request marked as reviewing.'
        );

        await loadAll();
      } catch (e: any) {
        console.error('[PARTNER STATUS]', e);
        setError(e?.message || 'Failed to update partnership request.');
      } finally {
        setBusyPartnerId(null);
      }
    },
    [partnerNotes, loadAll]
  );

  // ---------------- soft delete ----------------
  const deleteNdaRow = useCallback(
    async (ndaId: string) => {
      const ok = window.confirm('Delete this NDA request?\n\nThis will hide it (soft delete).');
      if (!ok) return;

      const key = `nda:${ndaId}`;

      try {
        setBusyDeleteKey(key);
        setError(null);
        setToast(null);

        const { error } = await supabase.rpc('admin_delete_nda', { nda_id: ndaId });
        if (error) throw error;

        setToast('✅ NDA request deleted (soft).');
        await loadAll();
      } catch (e: any) {
        console.error('[SOFT DELETE NDA]', e);
        setError(e?.message || 'Failed to delete NDA request.');
      } finally {
        setBusyDeleteKey(null);
      }
    },
    [supabase, loadAll]
  );

  const deleteInquiryRow = useCallback(
    async (inqId: string) => {
      const ok = window.confirm('Delete this investor inquiry?\n\nThis will hide it (soft delete).');
      if (!ok) return;

      const key = `inq:${inqId}`;

      try {
        setBusyDeleteKey(key);
        setError(null);
        setToast(null);

        const { error } = await supabase
          .from('investor_inquiries')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', inqId);

        if (error) throw error;

        setToast('✅ Inquiry deleted (soft).');
        await loadAll();
      } catch (e: any) {
        console.error('[SOFT DELETE INQUIRY]', e);
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
              activeTab === 'ideas' ? 'border-b-2 border-emerald-400 text-emerald-300' : 'text-white/60'
            }`}
          >
            <span>Pending Ideas</span>
            <span className="text-[11px] rounded-full px-2 py-0.5 bg-white/10 text-white/80">{pendingIdeasCount}</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2 text-sm flex items-center gap-2 ${
              activeTab === 'users' ? 'border-b-2 border-emerald-400 text-emerald-300' : 'text-white/60'
            }`}
          >
            <span>Users</span>
            <span className="text-[11px] rounded-full px-2 py-0.5 bg-white/10 text-white/80">{usersCount}</span>
          </button>

          <button
            onClick={() => setActiveTab('nda')}
            className={`pb-2 text-sm flex items-center gap-2 ${
              activeTab === 'nda' ? 'border-b-2 border-emerald-400 text-emerald-300' : 'text-white/60'
            }`}
          >
            <span>NDA Requests</span>
            <span className="text-[11px] rounded-full px-2 py-0.5 bg-white/10 text-white/80">{ndaCount}</span>
          </button>

          <button
            onClick={() => setActiveTab('inquiries')}
            className={`pb-2 text-sm flex items-center gap-2 ${
              activeTab === 'inquiries' ? 'border-b-2 border-emerald-400 text-emerald-300' : 'text-white/60'
            }`}
          >
            <span>Investor Inquiries</span>
            <span className="text-[11px] rounded-full px-2 py-0.5 bg-white/10 text-white/80">{inquiriesCount}</span>
            <span className="text-[11px] rounded-full px-2 py-0.5 bg-emerald-500/15 text-emerald-200">
              new: {newInquiriesCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('partners')}
            className={`pb-2 text-sm flex items-center gap-2 ${
              activeTab === 'partners' ? 'border-b-2 border-emerald-400 text-emerald-300' : 'text-white/60'
            }`}
          >
            <span>Partnership Requests</span>
            <span className="text-[11px] rounded-full px-2 py-0.5 bg-white/10 text-white/80">{partnersCount}</span>
           <span
  className={`text-[11px] rounded-full px-2 py-0.5 ${
    newPartnersCount > 0
      ? 'bg-red-500/20 text-red-300 animate-pulse'
      : 'bg-emerald-500/15 text-emerald-200'
  }`}
>
  new: {newPartnersCount}
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

       {/* IDEAS TAB */}
{activeTab === 'ideas' && (
  <section>
    {/* ✅ Clean filtering BEFORE rendering */}
    {(() => {
      const pendingIdeas = ideas.filter(
        (idea) => (idea.status || '').toLowerCase() === 'pending'
      );

      if (!loading && pendingIdeas.length === 0 && !error) {
        return <p className="text-sm text-white/60">No pending ideas.</p>;
      }

      return (
        <div className="overflow-x-auto text-sm">
          <table className="w-full border-collapse border border-white/10 text-left">
            <thead className="bg-white/5">
              <tr>
                <th className="px-3 py-2 border border-white/10">Created</th>
                <th className="px-3 py-2 border border-white/10">Title</th>
                <th className="px-3 py-2 border border-white/10">Category</th>
                <th className="px-3 py-2 border border-white/10">Status</th>
                <th className="px-3 py-2 border border-white/10">Actions</th>
              </tr>
            </thead>

            <tbody>
              {pendingIdeas.map((idea) => {
                const busy = busyIdeaId === idea.id;

                return (
                  <tr key={idea.id}>
                    <td className="px-3 py-2 border border-white/10 text-xs">
                      {fmt(idea.created_at)}
                    </td>

                    <td className="px-3 py-2 border border-white/10">
                      <div className="font-semibold">
                        {idea.title ?? 'Untitled idea'}
                      </div>
                      <div className="text-[11px] text-white/50 font-mono">
                        {idea.id}
                      </div>
                    </td>

                    <td className="px-3 py-2 border border-white/10">
                      {idea.category ?? '—'}
                    </td>

                    <td className="px-3 py-2 border border-white/10">
                      {idea.status}
                    </td>

                    <td className="px-3 py-2 border border-white/10">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/idea/${encodeURIComponent(idea.id)}`}
                          className="text-[11px] inline-flex items-center gap-2 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500"
                        >
                          Review / Actions
                        </Link>

                        <button
                          onClick={() => setIdeaStatus(idea.id, 'confirmed')}
                          disabled={busy}
                          className="text-[11px] px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                        >
                          {busy ? 'Working…' : 'Confirm'}
                        </button>

                        <button
                          onClick={() => setIdeaStatus(idea.id, 'blocked')}
                          disabled={busy}
                          className="text-[11px] px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-50"
                        >
                          Block
                        </button>
                        <button
  onClick={() => deleteIdeaRow(idea.id)}
  disabled={busyDeleteKey === `idea:${idea.id}`}
  className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
>
  {busyDeleteKey === `idea:${idea.id}` ? 'Deleting…' : 'Delete'}
</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-3 text-xs text-white/50">
            Tip: You can Confirm or Block ideas directly here.
          </div>
        </div>
      );
    })()}
  </section>
)}
        

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <section>
            {!loading && profiles.length === 0 && !error && <p className="text-sm text-white/60">No users yet.</p>}

            {profiles.length > 0 && (
              <div className="overflow-x-auto text-sm">
                <table className="w-full border-collapse border border-white/10 text-left">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-3 py-2 border border-white/10">Created</th>
                      <th className="px-3 py-2 border border-white/10">Name</th>
                      <th className="px-3 py-2 border border-white/10">Email</th>
                      <th className="px-3 py-2 border border-white/10">Role</th>
                      <th className="px-3 py-2 border border-white/10">User ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((p) => (
                      <tr key={p.id}>
                        <td className="px-3 py-2 border border-white/10 text-xs">{fmt(p.created_at)}</td>
                        <td className="px-3 py-2 border border-white/10">{p.full_name ?? '—'}</td>
                        <td className="px-3 py-2 border border-white/10">{p.email ?? '—'}</td>
                        <td className="px-3 py-2 border border-white/10">{p.role ?? '—'}</td>
                        <td className="px-3 py-2 border border-white/10 text-xs font-mono">{p.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* NDA TAB */}
        {activeTab === 'nda' && (
          <section>
            {ndaRequests.length === 0 && !loading && !error && <p className="text-sm text-white/60">No NDA requests yet.</p>}

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
                      const actionBusy = busyNdaId === r.id;
                      const delBusy = busyDeleteKey === `nda:${r.id}`;
                      const disabled = actionBusy || delBusy;

                      return (
                        <tr key={r.id}>
                          <td className="px-3 py-2 border border-white/10 text-xs">{r.id}</td>
                          <td className="px-3 py-2 border border-white/10 text-xs">{r.idea_id ?? '—'}</td>
                          <td className="px-3 py-2 border border-white/10">{getInvestorEmail(r)}</td>
                          <td className="px-3 py-2 border border-white/10">{r.status ?? 'pending'}</td>

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
                                disabled={disabled}
                              >
                                Uploaded
                              </button>
                            ) : (
                              <span className="text-[11px] text-white/40 italic">No NDA uploaded</span>
                            )}
                          </td>

                          <td className="px-3 py-2 border border-white/10 text-xs">{fmt(r.unblur_until)}</td>

                          <td className="px-3 py-2 border border-white/10">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => runNdaAction(r, 'send_nda_link')}
                                disabled={disabled}
                                className="text-[11px] px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                              >
                                {actionBusy ? 'Working…' : 'Send NDA link'}
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
                                onClick={() => runNdaAction(r, 'block_request')}
                                disabled={disabled}
                                className="text-[11px] px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50"
                              >
                                Block
                              </button>

                              <button
                                onClick={() => runNdaAction(r, 'reject_request')}
                                disabled={disabled}
                                className="text-[11px] px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-50"
                              >
                                Reject
                              </button>

                              <button
                                onClick={() => deleteNdaRow(r.id)}
                                disabled={disabled}
                                className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
                              >
                                {delBusy ? 'Deleting…' : 'Delete'}
                              </button>
                            </div>

                            {actionBusy && <div className="mt-2 text-[11px] text-white/50">Processing…</div>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="mt-3 text-xs text-white/50">
                  Tip: “Delete” is now a <span className="font-semibold">soft delete</span> (it hides the row). NDA actions still work.
                </div>
              </div>
            )}
          </section>
        )}

        {/* INVESTOR INQUIRIES TAB */}
        {activeTab === 'inquiries' && (
          <section>
            {inquiries.length === 0 && !loading && !error && <p className="text-sm text-white/60">No investor inquiries yet.</p>}

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
                      const actionBusy = busyInquiryId === r.id;
                      const delBusy = busyDeleteKey === `inq:${r.id}`;
                      const disabled = actionBusy || delBusy;

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
                            <div className="max-w-[420px] whitespace-pre-wrap text-white/80">{r.message ?? '—'}</div>
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
                                disabled={disabled || status === 'contacted' || status === 'closed'}
                                className="text-[11px] px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
                              >
                                Mark contacted
                              </button>

                              <button
                                onClick={() => setInquiryStatus(r, 'closed')}
                                disabled={disabled || status === 'closed'}
                                className="text-[11px] px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-50"
                              >
                                Close
                              </button>

                              <button
                                onClick={() => deleteInquiryRow(r.id)}
                                disabled={disabled}
                                className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
                              >
                                {delBusy ? 'Deleting…' : 'Delete'}
                              </button>
                            </div>

                            {actionBusy && <div className="mt-2 text-[11px] text-white/50">Updating…</div>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="mt-3 text-xs text-white/50">
                  Tip: Delete here is also <span className="font-semibold">soft delete</span> (it hides the inquiry).
                </div>
              </div>
            )}
          </section>
        )}

        {/* PARTNERS TAB */}
        {activeTab === 'partners' && (
          <section>
            {partnerRequests.length === 0 && !loading && !error && (
              <p className="text-sm text-white/60">No partnership requests yet.</p>
            )}

            {partnerRequests.length > 0 && (
              <div className="grid lg:grid-cols-2 gap-4">
                {partnerRequests.map((r) => {
                  const busy = busyPartnerId === r.id;

                  return (
                    <div key={r.id} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-extrabold">{r.org_name}</div>
                          <div className="text-xs text-white/60">
                            {r.org_type} • {r.partnership_type}
                          </div>
                        </div>

                        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold">
                          {r.status}
                        </span>
                      </div>

                      <div className="mt-3 text-sm text-white/75 space-y-1">
                        <div>
                          <b>Contact:</b> {r.contact_name} — {r.contact_email}
                        </div>
                        {r.contact_phone && (
                          <div>
                            <b>Phone:</b> {r.contact_phone}
                          </div>
                        )}
                        {r.country && (
                          <div>
                            <b>Country:</b> {r.country}
                          </div>
                        )}
                        {r.website && (
                          <div>
                            <b>Website:</b>{' '}
                            <a
                              href={r.website}
                              target="_blank"
                              rel="noreferrer"
                              className="underline text-emerald-300"
                            >
                              {r.website}
                            </a>
                          </div>
                        )}
                      </div>

                      {r.message && (
                        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70 whitespace-pre-wrap">
                          {r.message}
                        </div>
                      )}

                      <div className="mt-3 text-xs text-white/50">Submitted: {fmt(r.created_at)}</div>

                      <div className="mt-4">
                        <label className="text-xs font-bold text-white/70">Admin note (optional)</label>
                        <textarea
                          value={partnerNotes[r.id] ?? ''}
                          onChange={(e) =>
                            setPartnerNotes((prev) => ({
                              ...prev,
                              [r.id]: e.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-emerald-400 min-h-[90px]"
                          placeholder="Add internal notes..."
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => updatePartnerStatus(r.id, 'reviewing')}
                          disabled={busy}
                          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold hover:bg-white/10 disabled:opacity-60"
                        >
                          {busy ? 'Working…' : 'Mark Reviewing'}
                        </button>

                        <button
                          onClick={() => updatePartnerStatus(r.id, 'approved')}
                          disabled={busy}
                          className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-extrabold text-black hover:bg-emerald-300 disabled:opacity-60"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => updatePartnerStatus(r.id, 'rejected')}
                          disabled={busy}
                          className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-xs font-extrabold text-rose-200 hover:bg-rose-500/15 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}