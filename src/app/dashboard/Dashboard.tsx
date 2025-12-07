'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

type DashboardProps = {
  adminEmail: string; // ensure admin email is passed
};

type AnyRow = Record<string, any>;

export default function Dashboard({ adminEmail }: DashboardProps) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [pendingIdeas, setPendingIdeas] = useState<AnyRow[]>([]);
  const [profiles, setProfiles] = useState<AnyRow[]>([]);
  const [ndaRequests, setNdaRequests] = useState<AnyRow[]>([]);
  const [activeTab, setActiveTab] = useState<'ideas' | 'users' | 'nda'>('ideas');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  // Check Admin Access
  useEffect(() => {
    async function checkAdmin() {
      const { data } = await supabase.auth.getUser();
      const userEmail = data.user?.email ?? null;
      setCurrentUserEmail(userEmail);

      if (userEmail !== adminEmail) {
        router.replace('/');
      }
    }

    checkAdmin();
  }, [supabase, adminEmail, router]);

  useEffect(() => {
    if (currentUserEmail !== adminEmail) return;

    async function loadAll() {
      setLoading(true);
      setError(null);

      // 1. Pending ideas
      const { data: ideas, error: ideasError } = await supabase
        .from('ideas')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (ideasError) {
        setError('Ideas Error: ' + ideasError.message);
        setLoading(false);
        return;
      }
      setPendingIdeas(ideas ?? []);

      // 2. Profiles
      const { data: profs, error: profsError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profsError) {
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
        setError('NDA Error: ' + ndaError.message);
        setLoading(false);
        return;
      }
      setNdaRequests(nda ?? []);

      setLoading(false);
    }

    loadAll();
  }, [supabase, adminEmail, currentUserEmail]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">
        
        {/* ADMIN VERIFIED */}
        <h1 className="text-2xl font-semibold mb-2">Admin Dashboard</h1>
        {currentUserEmail && (
          <p className="text-sm text-emerald-300 mb-6">
            Signed in as <span className="font-mono">{currentUserEmail}</span>
          </p>
        )}

        {/* Tab buttons */}
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

        {/* Status */}
        {loading && <p className="text-sm text-white/70 mb-4">Loading data…</p>}
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        {/* IDEAS TAB */}
        {activeTab === 'ideas' && (
          <section>
            {pendingIdeas.length === 0 && !loading && !error && (
              <p className="text-sm text-white/60">No pending ideas right now.</p>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingIdeas.map((idea) => (
                <div key={idea.id} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                  <h2 className="text-lg font-semibold mb-1">{idea.title ?? 'Untitled idea'}</h2>
                  <p className="text-emerald-300 text-xs mb-1">{idea.tagline ?? idea.category}</p>
                  <p className="text-xs text-white/70 mb-3">{idea.impact ?? 'No impact description'}</p>

                  {/* Pending label */}
                  <p className="text-xs text-white/40 mb-3">Status: Pending Review</p>

                  {/* Open full view */}
<button
  // ✅ RIGHT (matches your folder)
  onClick={() => router.push(`/dashboard/idea/${idea.id}`)}
  className="text-xs bg-emerald-500 px-3 py-1 rounded hover:bg-emerald-400"
>
  View Now
</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <section>
            ...
          </section>
        )}

        {/* NDA TAB */}
        {activeTab === 'nda' && (
          <section>
            ...
          </section>
        )}
      </div>
    </main>
  );
}