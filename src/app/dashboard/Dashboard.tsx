'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/* -------------------- Types -------------------- */

type DashboardProps = {
  adminEmail: string;
};

type InquiryStatus = 'new' | 'contacted' | 'closed';

type InquiryRow = {
  id: string;
  idea_id: string;
  investor_name: string | null;
  investor_email: string | null;
  message: string | null;
  status: InquiryStatus | null;
  created_at: string | null;
  contacted_at: string | null;
  closed_at: string | null;
};

type IdeaMini = {
  id: string;
  title: string | null;
};

/* -------------------- Component -------------------- */

export default function Dashboard({ adminEmail }: DashboardProps) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [activeTab, setActiveTab] =
    useState<'inquiries'>('inquiries');

  const [inquiryFilter, setInquiryFilter] =
    useState<'all' | 'new' | 'contacted' | 'closed'>('new');

  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [ideasById, setIdeasById] = useState<Record<string, IdeaMini>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  /* -------------------- Helpers -------------------- */

  const fmt = (v: string | null) =>
    v ? new Date(v).toLocaleString() : '—';

  /* -------------------- Load Data -------------------- */

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [{ data: ideas }, { data: inquiries }] =
        await Promise.all([
          supabase.from('ideas').select('id, title'),
          supabase
            .from('investor_inquiries')
            .select('*')
            .order('created_at', { ascending: false }),
        ]);

      const map: Record<string, IdeaMini> = {};
      (ideas || []).forEach((i) => {
        map[i.id] = { id: i.id, title: i.title };
      });

      setIdeasById(map);
      setInquiries((inquiries || []) as InquiryRow[]);
    } catch (e: any) {
      setError(e?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /* -------------------- Filters -------------------- */

  const filteredInquiries = useMemo(() => {
    if (inquiryFilter === 'all') return inquiries;
    return inquiries.filter(
      (i) => (i.status ?? 'new') === inquiryFilter
    );
  }, [inquiries, inquiryFilter]);

  /* -------------------- Actions -------------------- */

  async function updateStatus(row: InquiryRow, status: InquiryStatus) {
    if (!row.id) return;

    setBusyId(row.id);
    setError(null);

    try {
      const patch: Partial<InquiryRow> = { status };
      if (status === 'contacted')
        patch.contacted_at = new Date().toISOString();
      if (status === 'closed')
        patch.closed_at = new Date().toISOString();

      const { error } = await supabase
        .from('investor_inquiries')
        .update(patch)
        .eq('id', row.id);

      if (error) throw error;

      setToast(`Inquiry marked as ${status}`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Failed to update inquiry');
    } finally {
      setBusyId(null);
    }
  }

  /* -------------------- Render -------------------- */

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-emerald-300 text-sm">
              Admin: {adminEmail}
            </p>
          </div>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/');
            }}
            className="bg-rose-600 px-3 py-1 rounded text-sm"
          >
            Log out
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {(['all', 'new', 'contacted', 'closed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setInquiryFilter(f)}
              className={`px-3 py-1 rounded-full text-xs border ${
                inquiryFilter === f
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                  : 'border-white/20 text-white/60'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {loading && <p>Loading…</p>}
        {error && <p className="text-red-400">{error}</p>}
        {toast && <p className="text-emerald-400">{toast}</p>}

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm border border-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="p-2">Created</th>
                <th className="p-2">Idea</th>
                <th className="p-2">Investor</th>
                <th className="p-2">Message</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredInquiries.map((r) => (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="p-2">{fmt(r.created_at)}</td>

                  <td className="p-2">
                    {ideasById[r.idea_id]?.title || '—'}
                  </td>

                  <td className="p-2">
                    <div>{r.investor_name || '—'}</div>
                    <div className="text-xs text-white/60">
                      {r.investor_email || '—'}
                    </div>
                  </td>

                  <td className="p-2 max-w-md whitespace-pre-wrap">
                    {r.message || '—'}
                  </td>

                  <td className="p-2">
                    {r.status || 'new'}
                  </td>

                  <td className="p-2 flex gap-2">
                    <a
                      href={
                        r.investor_email
                          ? `mailto:${r.investor_email}`
                          : undefined
                      }
                      className="px-2 py-1 text-xs bg-indigo-600 rounded"
                    >
                      Email
                    </a>

                    <button
                      disabled={busyId === r.id}
                      onClick={() => updateStatus(r, 'contacted')}
                      className="px-2 py-1 text-xs bg-emerald-600 rounded"
                    >
                      Contacted
                    </button>

                    <button
                      disabled={busyId === r.id}
                      onClick={() => updateStatus(r, 'closed')}
                      className="px-2 py-1 text-xs bg-rose-600 rounded"
                    >
                      Close
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}