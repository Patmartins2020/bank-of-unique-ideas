'use client';

import { useEffect, useMemo, useState } from 'react';

type Row = {
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
  status: 'new' | 'reviewing' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
};

export default function AdminPartnersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/admin/partner-requests', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to load');
      setRows(data.rows ?? []);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: Row['status']) {
    try {
      const res = await fetch('/api/admin/partner-requests/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, adminNote: activeId === id ? note : null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to update');
      await load();
    } catch (e: any) {
      alert(e?.message || 'Failed to update');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const byStatus = useMemo(() => {
    const map: Record<string, number> = { new: 0, reviewing: 0, approved: 0, rejected: 0 };
    for (const r of rows) map[r.status] = (map[r.status] ?? 0) + 1;
    return map;
  }, [rows]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white px-6 pt-24 pb-12">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-emerald-300">Partnership Requests</h1>
            <p className="mt-1 text-white/65">Review and approve/reject partnership applications.</p>
          </div>

          <div className="flex gap-2 text-xs">
            {(['new', 'reviewing', 'approved', 'rejected'] as const).map((s) => (
              <span key={s} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/70">
                {s}: <b className="text-white">{byStatus[s] ?? 0}</b>
              </span>
            ))}
          </div>
        </div>

        {loading && <p className="text-white/70">Loading…</p>}
        {err && <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">{err}</div>}

        {!loading && !err && rows.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
            No requests yet.
          </div>
        )}

        {!loading && !err && rows.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-4">
            {rows.map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-extrabold">{r.org_name}</div>
                    <div className="text-xs text-white/60">{r.org_type} • {r.partnership_type}</div>
                  </div>

                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold">
                    {r.status}
                  </span>
                </div>

                <div className="mt-3 text-sm text-white/75">
                  <div><b>Contact:</b> {r.contact_name} — {r.contact_email}</div>
                  {r.contact_phone && <div><b>Phone:</b> {r.contact_phone}</div>}
                  {r.country && <div><b>Country:</b> {r.country}</div>}
                  {r.website && <div><b>Website:</b> {r.website}</div>}
                </div>

                {r.message && (
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                    {r.message}
                  </div>
                )}

                <div className="mt-3 text-xs text-white/50">
                  Submitted: {new Date(r.created_at).toLocaleString()}
                </div>

                <div className="mt-4">
                  <label className="text-xs font-bold text-white/70">Admin note (optional)</label>
                  <textarea
                    className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-emerald-400 min-h-[90px]"
                    value={activeId === r.id ? note : (r.admin_note ?? '')}
                    onFocus={() => {
                      setActiveId(r.id);
                      setNote(r.admin_note ?? '');
                    }}
                    onChange={(e) => {
                      setActiveId(r.id);
                      setNote(e.target.value);
                    }}
                    placeholder="Add internal notes..."
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => updateStatus(r.id, 'reviewing')}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold hover:bg-white/10"
                  >
                    Mark Reviewing
                  </button>
                  <button
                    onClick={() => updateStatus(r.id, 'approved')}
                    className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-extrabold text-black hover:bg-emerald-300"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(r.id, 'rejected')}
                    className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-xs font-extrabold text-rose-200 hover:bg-rose-500/15"
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