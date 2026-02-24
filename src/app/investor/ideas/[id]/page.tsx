'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type IdeaRow = {
  id: string;
  title: string | null;
  tagline: string | null;
  category: string | null;
  protected: boolean | null;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  role: string | null;
};

export default function InvestorIdeasPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [requestingId, setRequestingId] = useState<string | null>(null);

  // ---------------- LOAD DATA ----------------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // auth
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) {
          router.replace('/login');
          return;
        }

        // role check
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', auth.user.id)
          .maybeSingle<ProfileRow>();

        if ((profile?.role ?? 'investor') !== 'investor') {
          router.replace('/');
          return;
        }

        // ideas (confirmed only)
        const { data, error } = await supabase
          .from('ideas')
          .select('id,title,tagline,category,protected,created_at')
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!cancelled) setIdeas(data ?? []);
      } catch (e: any) {
        console.error(e);
        if (!cancelled) setError(e?.message || 'Failed to load ideas.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  // ---------------- REQUEST NDA ----------------
  async function requestNDA(ideaId: string) {
    try {
      setRequestingId(ideaId);

      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace('/login');
        return;
      }

      const res = await fetch('/api/nda/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaId,
          userId: data.user.id,
          email: data.user.email,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Request failed');

      alert(json?.message || 'NDA request sent.');
    } catch (e: any) {
      alert(e?.message || 'Failed to request NDA');
    } finally {
      setRequestingId(null);
    }
  }

  // ---------------- FILTERS ----------------
  const categories = useMemo(() => {
    const set = new Set<string>();
    ideas.forEach((i) => set.add(i.category ?? 'General'));
    return ['All', ...Array.from(set)];
  }, [ideas]);

  const filteredIdeas = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ideas.filter((i) => {
      const cat = i.category ?? 'General';
      return (
        (category === 'All' || category === cat) &&
        (!q || `${i.title} ${i.tagline} ${cat}`.toLowerCase().includes(q))
      );
    });
  }, [ideas, search, category]);

  // ---------------- UI ----------------
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white px-6 pt-24 pb-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-emerald-300">Investor Ideas</h1>

        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas…"
            className="rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        {loading && <p className="text-white/70">Loading…</p>}
        {error && <p className="text-rose-400">{error}</p>}

        {!loading && filteredIdeas.length === 0 && (
          <p className="text-white/60">No ideas found.</p>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map((idea) => {
            const isProtected = !!idea.protected;

            return (
              <div
                key={idea.id}
                className="rounded-2xl border border-white/10 bg-black/40 p-5"
              >
                <h2 className="text-lg font-semibold">
                  {isProtected ? (
                    <span className="blur-sm select-none">
                      {idea.title ?? 'Protected Idea'}
                    </span>
                  ) : (
                    idea.title ?? 'Untitled'
                  )}
                </h2>

                <p className="text-xs text-emerald-300 mt-1">
                  {idea.category ?? 'General'}
                </p>

                <p className="text-xs text-white/70 mt-2">
                  {isProtected ? (
                    <span className="blur-sm select-none">
                      {idea.tagline ?? 'NDA required'}
                    </span>
                  ) : (
                    idea.tagline ?? '—'
                  )}
                </p>

                <div className="mt-4 flex justify-between items-center">
                  {isProtected ? (
                    <button
                      onClick={() => requestNDA(idea.id)}
                      disabled={requestingId === idea.id}
                      className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15"
                    >
                      {requestingId === idea.id ? 'Requesting…' : 'Request NDA'}
                    </button>
                  ) : (
                    <Link
                      href={`/investor/ideas/${idea.id}`}
                      className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15"
                    >
                      Open
                    </Link>
                  )}

                  {isProtected && (
                    <span className="text-[11px] text-white/50">🔒 NDA required</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}