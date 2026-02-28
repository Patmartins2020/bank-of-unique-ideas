'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NdaModal from '../components/NdaModal';
import { supabase } from '@/lib/supabase';
import { NDAStatus } from '@/lib/types';

type Idea = {
  id: string;
  title: string;
  tagline: string;
  impact: string;
  category: string;
  status: NDAStatus;
  protected: boolean;
};

export default function Home() {
  const router = useRouter();

  // UI state
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');

  // Data state
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  // Auth/access state
  const [userId, setUserId] = useState<string | null>(null);
  const [accessSet, setAccessSet] = useState<Set<string>>(new Set());

  // NDA modal state
  const [ndaOpen, setNdaOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      setLoadErr(null);

      try {
        // 1) Auth
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData?.user?.id ?? null;
        if (!cancelled) setUserId(uid);

        // 2) Confirmed ideas only
        const { data: ideasData, error: ideasErr } = await supabase
          .from('ideas')
          .select('id,title,tagline,impact,category,status,protected,created_at')
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false });

        if (ideasErr) throw ideasErr;

        const confirmedIdeas: Idea[] = (ideasData ?? []).map((r: any) => ({
          id: String(r.id),
          title: r.title ?? '',
          tagline: r.tagline ?? '',
          impact: r.impact ?? '',
          category: r.category ?? 'General',
          status: r.status ?? 'confirmed',
          protected: r.protected ?? true,
        }));

        // 3) Access set (only if logged in)
        let s = new Set<string>();
        if (uid) {
          const nowIso = new Date().toISOString();

          const { data: accessData, error: accessErr } = await supabase
            .from('idea_access')
            .select('idea_id, status, expires_at')
            .eq('investor_id', uid)
            .eq('status', 'active')
            .or(`expires_at.is.null,expires_at.gt.${nowIso}`);

          if (!accessErr) {
            s = new Set((accessData ?? []).map((a: any) => String(a.idea_id)));
          }
        }

        if (cancelled) return;

        setIdeas(confirmedIdeas);
        setAccessSet(s);
      } catch (e: any) {
        console.error('Home load error:', e?.message || e);
        if (!cancelled) {
          setIdeas([]);
          setAccessSet(new Set());
          setLoadErr(e?.message || 'Failed to load ideas.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const cats = useMemo(() => {
    return ['All', ...Array.from(new Set(ideas.map((i) => i.category))).filter(Boolean)];
  }, [ideas]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ideas.filter((i) => {
      const matchesCat = cat === 'All' || i.category === cat;
      const hay = `${i.title} ${i.tagline || ''} ${i.impact || ''}`.toLowerCase();
      const matchesSearch = !q || hay.includes(q);
      return matchesCat && matchesSearch;
    });
  }, [ideas, search, cat]);

  const isBlurred = (idea: Idea) => {
    if (!idea.protected) return false;
    return !accessSet.has(String(idea.id));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
    router.refresh();
  };

  return (
    <main className="min-h-screen px-6 py-12 text-white bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900">
      {/* Top bar */}
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-400">Global Bank of Unique Ideas</h1>
          <p className="text-white/60 text-sm">Explore protected innovations. Full access requires an account.</p>
        </div>

        <div className="flex items-center gap-2">
          {!userId ? (
            <>
              <button
                onClick={() => router.push('/login')}
                className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-black hover:bg-emerald-300 transition"
              >
                Log in
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="rounded-full border border-emerald-400 px-5 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/10 transition"
              >
                Sign up
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-400 transition"
            >
              Log out
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto flex gap-2 items-center flex-wrap mb-6">
        <input
          type="text"
          placeholder="Search ideas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-md w-64 bg-neutral-800 text-white border border-neutral-700 focus:border-emerald-400 outline-none"
        />

        <div className="flex gap-2 flex-wrap">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-2 rounded-md text-xs border ${
                cat === c ? 'border-white/40 bg-white/10' : 'border-white/15 bg-white/5 text-white/80'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {loadErr && <p className="mb-4 text-xs text-amber-300">{loadErr}</p>}

        {loading ? (
          <div className="grid place-items-center py-10">
            <p className="text-gray-400">Loading ideas…</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((idea) => {
                const blurred = isBlurred(idea);

                return (
                  <div
                    key={idea.id}
                    className="group relative p-6 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-emerald-400 transition text-left overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <h2
                        className={`text-xl font-semibold mb-2 text-emerald-300 ${
                          blurred ? 'blur-sm select-none pointer-events-none' : ''
                        }`}
                        title={blurred ? 'Hidden — request NDA to view.' : undefined}
                      >
                        {idea.title}
                      </h2>

                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 text-white/70">
                        {idea.category} • {idea.status}
                      </span>
                    </div>

                    <p className={`text-gray-300 ${blurred ? 'blur-sm select-none pointer-events-none' : ''}`}>
                      {idea.tagline || '—'}
                    </p>

                    <p className={`text-gray-500 text-sm mt-2 ${blurred ? 'blur-sm select-none pointer-events-none' : ''}`}>
                      {idea.impact || '—'}
                    </p>

                    {idea.protected && !blurred && (
                      <div className="mt-4 text-[11px] text-emerald-300">✅ Access granted</div>
                    )}

                    {blurred && (
                      <div className="mt-4 text-[11px] text-white/60">
                        🔒 Confidential — NDA required
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-3">
                      {blurred ? (
                        <button
                          onClick={() => {
                            setSelectedIdea({ id: idea.id, title: idea.title });
                            setNdaOpen(true);
                          }}
                          className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-black hover:opacity-90"
                        >
                          Request NDA
                        </button>
                      ) : (
                        <span className="text-xs text-white/60">Visible</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Links (optional) */}
            <div className="mt-10 space-y-2 text-sm text-white/70">
              <p>
                <strong>Are you an investor?</strong>{' '}
                <Link href="/login" className="underline text-emerald-300">
                  Log in
                </Link>
              </p>

              <p>
                <strong>Are you an inventor?</strong>{' '}
                <Link href="/signup" className="underline text-emerald-300">
                  Sign up
                </Link>
              </p>

              <p className="text-[11px] text-white/40">User: {userId ? 'signed in' : 'guest'}</p>
            </div>

            {selectedIdea && (
              <NdaModal
                open={ndaOpen}
                onClose={() => setNdaOpen(false)}
                ideaId={selectedIdea.id}
                ideaTitle={selectedIdea.title}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}