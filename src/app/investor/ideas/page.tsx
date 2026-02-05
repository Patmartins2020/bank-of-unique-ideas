'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type IdeaRow = {
  id: string;
  title: string | null;
  category: string | null;
  status: string | null;
  protected: boolean | null;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  role: string | null;
  full_name: string | null;
};

export default function InvestorIdeasPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        // 1) Must be logged in
        const { data: auth } = await supabase.auth.getUser();
        const user = auth.user;
        if (!user) {
          router.replace('/login');
          return;
        }

        // 2) Must be investor
        const { data: prof } = await supabase
          .from('profiles')
          .select('id, role, full_name')
          .eq('id', user.id)
          .maybeSingle<ProfileRow>();

        const role =
          (prof?.role ?? (user.user_metadata as any)?.role ?? 'investor') as string;

        if (role !== 'investor') {
          router.replace('/');
          return;
        }

        // 3) Load confirmed ideas only
        const { data, error } = await supabase
          .from('ideas')
          .select('id, title, category, status, protected, created_at')
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!cancelled) setIdeas((data ?? []) as IdeaRow[]);
      } catch (e: any) {
        console.error(e);
        if (!cancelled) setErr(e?.message || 'Failed to load ideas.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  // Categories
  const cats = useMemo(() => {
    const set = new Set<string>();
    for (const i of ideas) set.add(i.category ?? 'General');
    return ['All', ...Array.from(set)];
  }, [ideas]);

  // Filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ideas.filter((i) => {
      const catLabel = i.category ?? 'General';
      const matchesCat = cat === 'All' || catLabel === cat;
      const hay = `${i.title ?? ''} ${catLabel}`.toLowerCase();
      const matchesSearch = !q || hay.includes(q);
      return matchesCat && matchesSearch;
    });
  }, [ideas, search, cat]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white px-6 pt-24 pb-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-emerald-300">
              Investor Ideas
            </h1>
            <p className="text-white/70 mt-1">
              Browse confirmed ideas. Protected briefs may require NDA.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/investor"
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Back to Dashboard
            </Link>

            <a
              href="/nda-template/NDA.pdf"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Download NDA
            </a>
          </div>
        </div>

        {/* Search + category */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas..."
            className="w-64 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          />

          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full px-3 py-1 text-xs border ${
                  cat === c
                    ? 'border-white/30 bg-white/10'
                    : 'border-white/10 bg-white/5 text-white/75'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="text-white/70">Loading ideas...</p>}

        {err && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">
            {err}
          </div>
        )}

        {!loading && !err && filtered.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
            No confirmed ideas found yet.
          </div>
        )}

        {!loading && !err && filtered.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((idea) => (
              <div
                key={idea.id}
                className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-lg shadow-black/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-white/95 break-words">
                    {idea.protected ? '🔒 Protected Idea' : idea.title ?? 'Untitled'}
                  </h2>

                  <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30">
                    Confirmed
                  </span>
                </div>

                <p className="mt-1 text-xs text-emerald-300">
                  {idea.category ?? 'General'}
                </p>

                <p className="mt-3 text-xs text-white/60">
                  {idea.created_at ? new Date(idea.created_at).toLocaleDateString() : ''}
                </p>

               <div className="mt-4 flex items-center justify-between">
  <Link
    href={`/investor/ideas/${idea.id}`}
    className="text-xs rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/15"
  >
    Open
  </Link>

  <a
    href="/nda-template/NDA.pdf"
    target="_blank"
    rel="noreferrer"
    className="text-xs text-white/60 underline hover:text-white"
  >
    Download NDA
  </a>
</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}