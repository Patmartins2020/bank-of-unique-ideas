'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

type DashboardProps = {
  adminEmail: string;
};

type AnyRow = Record<string, any>;
type IdeaStatus = 'pending' | 'viewed' | 'confirmed' | 'blocked' | string;

export default function Dashboard({ adminEmail }: DashboardProps) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [ideas, setIdeas] = useState<AnyRow[]>([]);
  const [profiles, setProfiles] = useState<AnyRow[]>([]);
  const [ndaRequests, setNdaRequests] = useState<AnyRow[]>([]);
  const [activeTab, setActiveTab] = useState<'ideas' | 'users' | 'nda'>(
    'ideas'
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      setError(null);

      // 1. Ideas
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
      setIdeas(ideasData ?? []);

      // 2. Profiles
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
      setProfiles(profs ?? []);

      // 3. NDA requests
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
      setNdaRequests(nda ?? []);

      setLoading(false);
    }

    loadAll();
  }, [supabase]);

  // counts
  const pendingIdeasCount = ideas.reduce((acc, idea) => {
    const status: IdeaStatus = idea.status ?? 'pending';
    return status === 'pending' ? acc + 1 : acc;
  }, 0);

  const usersCount = profiles.length;
  const ndaCount = ndaRequests.length;

 // ------------ NDA actions --------------
// ------------ NDA actions (CLEAN VERSION) --------------

async function updateNdaStatus(
  row: AnyRow,
  newStatus: 'approved' | 'rejected'
) {
  console.log('[NDA] 0) updateNdaStatus clicked:', {
    id: row?.id,
    newStatus,
  });

  if (!row || !row.id) {
    setError('Invalid NDA request.');
    return;
  }

  try {
    setLoading(true);
    setError(null);

    // 1️⃣ Prepare DB update
    const updates: Record<string, any> = {
      status: newStatus,
    };

    if (newStatus === 'approved') {
      const until = new Date();
      until.setDate(until.getDate() + 7); // access window
      updates.unblur_until = until.toISOString();
    } else {
      updates.unblur_until = null;
    }

    console.log('[NDA] 1) Updating DB with:', updates);

    // 2️⃣ Update database
    const { error: updateError } = await supabase
      .from('nda_requests')
      .update(updates)
      .eq('id', row.id);

    if (updateError) {
      console.error('[NDA] DB update failed:', updateError);
      throw updateError;
    }

    console.log('[NDA] 2) DB update successful');

    // 3️⃣ Update UI state immediately
    setNdaRequests((prev) =>
      prev.map((r) =>
        r.id === row.id ? { ...r, ...updates } : r
      )
    );

    // 4️⃣ Send email (only if email exists)
    if (row.email) {
      console.log('[NDA] 3) Sending email notification');

      const res = await fetch('/api/nda/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ndaId: row.id,
          investorEmail: row.email,
          investorName: row.investor_name ?? 'Investor',
          ideaTitle: row.idea_title ?? 'Idea',
          decision: newStatus,
          unblurUntil: updates.unblur_until,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('[NDA] Email API failed:', text);
        throw new Error('Email notification failed.');
      }

      console.log('[NDA] 4) Email sent successfully');
    } else {
      console.warn('[NDA] No email on NDA request — email skipped');
    }
  } catch (err: any) {
    console.error('[NDA] ERROR:', err);
    setError(err?.message || 'Failed to update NDA request.');
  } finally {
    setLoading(false);
  }
}

  // ---------------------------------------

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
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        {/* IDEAS TAB (unchanged from your version) */}
        {activeTab === 'ideas' && (
          <section>
            {ideas.length === 0 && !loading && !error && (
              <p className="text-sm text-white/60">No ideas yet.</p>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ideas.map((idea) => {
                const status: IdeaStatus = idea.status ?? 'pending';

                const statusLabel =
                  status === 'pending'
                    ? 'Pending review'
                    : status === 'viewed'
                    ? 'Viewed'
                    : status === 'confirmed'
                    ? 'Confirmed'
                    : status === 'blocked'
                    ? 'Blocked'
                    : status;

                const buttonText =
                  status === 'pending'
                    ? 'View Now'
                    : status === 'viewed'
                    ? 'Viewed'
                    : status === 'confirmed'
                    ? 'Confirmed'
                    : status === 'blocked'
                    ? 'Blocked'
                    : 'View';

                const buttonClasses =
                  status === 'confirmed'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : status === 'viewed'
                    ? 'bg-slate-600 hover:bg-slate-500'
                    : status === 'blocked'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-500 hover:bg-emerald-400';

                return (
                  <div
                    key={idea.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm"
                  >
                    <h2 className="text-lg font-semibold mb-1">
                      {idea.title ?? 'Untitled idea'}
                    </h2>
                    <p className="text-emerald-300 text-xs mb-1">
                      {idea.tagline ?? idea.category ?? 'No tagline'}
                    </p>
                    <p className="text-xs text-white/70 mb-3">
                      {idea.impact ?? 'No impact description'}
                    </p>

                    <p className="text-xs text-white/40 mb-3">
                      Status: {statusLabel}
                    </p>

                    <button
                      onClick={() => router.push(`/dashboard/idea/${idea.id}`)}
                      className={`text-xs px-3 py-1 rounded ${buttonClasses}`}
                    >
                      {buttonText}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* USERS TAB (unchanged) */}
        {activeTab === 'users' && (
          <section>
            {profiles.length === 0 && !loading && !error && (
              <p className="text-sm text-white/60">No users found yet.</p>
            )}

            {profiles.length > 0 && (
              <div className="overflow-x-auto text-sm">
                <table className="w-full border-collapse border border-white/10 text-left">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-3 py-2 border border-white/10">ID</th>
                      <th className="px-3 py-2 border border-white/10">
                        Email
                      </th>
                      <th className="px-3 py-2 border border-white/10">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((p) => (
                      <tr key={p.id}>
                        <td className="px-3 py-2 border border-white/10 text-xs">
                          {p.id}
                        </td>
                        <td className="px-3 py-2 border border-white/10">
                          {p.email ?? p.contact_email ?? '—'}
                        </td>
                        <td className="px-3 py-2 border border-white/10">
                          {p.role ?? 'inventor'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* NDA TAB with actions */}
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
                      <th className="px-3 py-2 border border-white/10">
                        Idea ID
                      </th>
                      <th className="px-3 py-2 border border-white/10">
                        Investor Email
                      </th>
                      <th className="px-3 py-2 border border-white/10">
                        Status
                      </th>
                      <th className="px-3 py-2 border border-white/10">
                        Access until
                      </th>
                      <th className="px-3 py-2 border border-white/10">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ndaRequests.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2 border border-white/10 text-xs">
                          {r.id}
                        </td>
                        <td className="px-3 py-2 border border-white/10 text-xs">
                          {r.idea_id ?? '—'}
                        </td>
                        <td className="px-3 py-2 border border-white/10">
                          {r.email ?? '—'}
                        </td>
                        <td className="px-3 py-2 border border-white/10">
                          {r.status ?? 'requested'}
                        </td>
                        <td className="px-3 py-2 border border-white/10 text-xs">
                          {r.unblur_until
                            ? new Date(
                                r.unblur_until as string
                              ).toLocaleString()
                            : '—'}
                        </td>
                        <td className="px-3 py-2 border border-white/10">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                console.log(
                                  '[NDA] Approve button clicked in UI:',
                                  r.id
                                );
                                updateNdaStatus(r, 'approved');
                              }}
                              className="text-[11px] px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50"
                              disabled={r.status === 'approved'}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                console.log(
                                  '[NDA] Reject button clicked in UI:',
                                  r.id
                                );
                                updateNdaStatus(r, 'rejected');
                              }}
                              className="text-[11px] px-2 py-1 rounded bg-rose-500 hover:bg-rose-400 disabled:opacity-50"
                              disabled={r.status === 'rejected'}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
