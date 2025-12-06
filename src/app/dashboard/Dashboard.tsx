'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type DashboardProps = {
  adminEmail?: string;
};

type AnyRow = Record<string, any>;

export default function Dashboard({ adminEmail }: DashboardProps) {
  const supabase = createClientComponentClient();

  const [pendingIdeas, setPendingIdeas] = useState<AnyRow[]>([]);
  const [profiles, setProfiles] = useState<AnyRow[]>([]);
  const [ndaRequests, setNdaRequests] = useState<AnyRow[]>([]);
  const [activeTab, setActiveTab] = useState<'ideas' | 'users' | 'nda'>('ideas');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState(null);

  useEffect(() => {
     async function loadAll() {
      setLoading(true);
      setError(null);

      // 1. Pending ideas
      const { data: ideas, error: ideasError } = await supabase
        .from('ideas')
        .select('*') // no hard-coded columns
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (ideasError) {
        console.error('Supabase ideas error:', ideasError);
        setError(Ideas Error: ${ideasError.message});
        setLoading(false);
        return;
      }
      setPendingIdeas(ideas ?? []);

      // 2. Profiles / users
      const { data: profs, error: profsError } = await supabase
        .from('profiles')
        .select('*') // no hard-coded email/display_name
        .order('created_at', { ascending: false });

      if (profsError) {
        console.error('Supabase profiles error:', profsError);
        setError(Profiles Error: ${profsError.message});
        setLoading(false);
        return;
      }
      setProfiles(profs ?? []);

      // 3. NDA requests
      const { data: nda, error: ndaError } = await supabase
        .from('nda_requests')
        .select('*') // no hard-coded email
        .order('created_at', { ascending: false });

      if (ndaError) {
        console.error('Supabase NDA error:', ndaError);
        setError(NDA Error: ${ndaError.message});
        setLoading(false);
        return;
      }
      setNdaRequests(nda ?? []);

      setLoading(false);
    }

    loadAll();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Admin Dashboard</h1>
        {adminEmail && (
          <p className="text-sm text-emerald-300 mb-6">
            Signed in as <span className="font-mono">{adminEmail}</span>
          </p>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/10 mb-6">
          <button
            onClick={() => setActiveTab('ideas')}
            className={`pb-2 text-sm ${
              activeTab === 'ideas'
                ? 'border-b-2 border-emerald-400 text-emerald-300'
                : 'text-white/60'
            }`}
          >
            Pending Ideas
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2 text-sm ${
              activeTab === 'users'
                ? 'border-b-2 border-emerald-400 text-emerald-300'
                : 'text-white/60'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('nda')}
            className={`pb-2 text-sm ${
              activeTab === 'nda'
                ? 'border-b-2 border-emerald-400 text-emerald-300'
                : 'text-white/60'
            }`}
          >
            NDA Requests
          </button>
        </div>

        {/* Status text */}
        {loading && <p className="text-sm text-white/70 mb-4">Loading data…</p>}
            {error && (
          <p className="text-sm text-red-400 mb-4">
            {error}
          </p>
        )}

        {/* Pending Ideas */}
        {activeTab === 'ideas' && (
          <section>
            {pendingIdeas.length === 0 && !loading && !error && (
              <p className="text-sm text-white/60">No pending ideas right now.</p>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingIdeas.map((idea) => (
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
                  <p className="text-[11px] text-white/50">
                    Status: <span className="capitalize">{idea.status ?? 'pending'}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <section>
            {profiles.length === 0 && !loading && !error && (
              <p className="text-sm text-white/60">No users found yet.</p>
            )}

            <div className="overflow-x-auto text-sm">
              <table className="w-full border-collapse border border-white/10 text-left">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-3 py-2 border border-white/10">ID</th>
                    <th className="px-3 py-2 border border-white/10">Email (any)</th>
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
                        {/* we don't know your exact email column name, so try a few or fall back */}
                        {p.email ?? p.contact_email ?? p.user_email ?? '—'}
                      </td>
                      <td className="px-3 py-2 border border-white/10">
                        {p.role ?? 'inventor'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* NDA Requests */}
        {activeTab === 'nda' && (
          <section>
            {ndaRequests.length === 0 && !loading && !error && (
                 <p className="text-sm text-white/60">No NDA requests yet.</p>
            )}

            <div className="overflow-x-auto text-sm">
              <table className="w-full border-collapse border border-white/10 text-left">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-3 py-2 border border-white/10">ID</th>
                    <th className="px-3 py-2 border border-white/10">Idea ID</th>
                    <th className="px-3 py-2 border border-white/10">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ndaRequests.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2 border border-white/10 text-xs">
                        {r.id}
                      </td>
                      <td className="px-3 py-2 border border-white/10">
                        {r.idea_id ?? '—'}
                      </td>
                      <td className="px-3 py-2 border border-white/10">
                        {r.status ?? 'pending'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}