'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

type IdeaRow = {
  id: string;
  title: string;
  category: string | null;
  status: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string; // if your profiles table uses "id" = auth.uid()
  full_name: string | null;
  role: string | null;
};

export default function MyIdeasPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('Inventor');
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);

  // simple counters
  const counts = useMemo(() => {
    const pending = ideas.filter((i) => i.status === 'pending').length;
    const confirmed = ideas.filter((i) => i.status === 'confirmed').length;
    const blocked = ideas.filter((i) => i.status === 'blocked').length;
    return { pending, confirmed, blocked };
  }, [ideas]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // 1) Must be logged in
        const { data: uRes, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;

        const user = uRes.user;
        if (!user) {
          router.replace('/login');
          return;
        }

        // 2) Profile is OPTIONAL (never block page if it fails)
        try {
          const { data: prof, error: profErr } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('id', user.id)
            .maybeSingle<ProfileRow>();

          // If profiles table is blocked by RLS or missing row, we ignore it safely
          if (!profErr && prof) {
            const name =
              prof.full_name ||
              (user.user_metadata as any)?.full_name ||
              user.email ||
              'Inventor';
            if (!cancelled) setDisplayName(name);
          } else {
            // fallback name (still okay)
            const name =
              (user.user_metadata as any)?.full_name || user.email || 'Inventor';
            if (!cancelled) setDisplayName(name);
          }
        } catch {
          // ignore profile completely
          const name =
            (user.user_metadata as any)?.full_name || user.email || 'Inventor';
          if (!cancelled) setDisplayName(name);
        }

        // 3) Load ideas (THIS is what matters)
        const { data: ideaRows, error: ideaErr } = await supabase
          .from('ideas')
          .select('id, title, category, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ideaErr) throw ideaErr;

        if (!cancelled) {
          setIdeas((ideaRows || []) as IdeaRow[]);
        }
      } catch (e: any) {
        console.error(e);
        if (!cancelled) setError(e?.message || 'Failed to load your ideas.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0b1120] text-white grid place-items-center">
        <p className="text-white/70">Loading your ideas…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b1120] text-white px-6 pt-24 pb-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl font-extrabold text-emerald-400">My Ideas</h1>
            <p className="text-white/70 mt-2">
              Welcome, <span className="text-white font-semibold">{displayName}</span> — Only you and
              approved parties can view these ideas.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">
              Pending {counts.pending}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">
              Confirmed {counts.confirmed}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">
              Blocked {counts.blocked}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200">
            {error}
          </div>
        )}

        <div className="mt-8 flex gap-6 text-emerald-300 underline">
          <button onClick={() => router.push('/submit')}>Submit another idea</button>
          <button onClick={() => router.push('/')}>Back home</button>
        </div>

        <div className="mt-8 grid gap-4">
          {ideas.length === 0 ? (
            <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-white/70">
              No ideas yet. Click “Submit another idea”.
            </div>
          ) : (
            ideas.map((i) => (
              <div
                key={i.id}
                className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
              >
                <div className="flex justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-lg font-bold">{i.title}</h3>
                    <p className="text-white/60 text-sm mt-1">
                      {i.category || 'General'} • {new Date(i.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-black/30 border border-white/10 text-sm">
                    {i.status || 'pending'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}