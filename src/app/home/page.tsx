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

  // NDA modal
  const [ndaOpen, setNdaOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<{ id: string; title: string } | null>(null);

  // Tooltip state (mouse-based)
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
    visible: boolean;
  }>({ text: '', x: 0, y: 0, visible: false });

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        setLoading(true);

        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id ?? null;
        if (!cancelled) setUserId(uid);

        const { data, error } = await supabase
          .from('ideas')
          .select('id,title,tagline,impact,category,status,protected,created_at')
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mapped: Idea[] = (data ?? []).map((r: any) => ({
          id: String(r.id),
          title: r.title ?? '',
          tagline: r.tagline ?? '',
          impact: r.impact ?? '',
          category: r.category ?? 'General',
          status: r.status,
          protected: r.protected ?? true,
        }));

        let s = new Set<string>();
        if (uid) {
          const nowIso = new Date().toISOString();
          const { data: access } = await supabase
            .from('idea_access')
            .select('idea_id')
            .eq('investor_id', uid)
            .eq('status', 'active')
            .or(`expires_at.is.null,expires_at.gt.${nowIso}`);

          s = new Set((access ?? []).map((a: any) => String(a.idea_id)));
        }

        if (!cancelled) {
          setIdeas(mapped);
          setAccessSet(s);
        }
      } catch (e: any) {
        setLoadErr(e?.message || 'Failed to load ideas.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const cats = useMemo(
    () => ['All', ...Array.from(new Set(ideas.map((i) => i.category)))],
    [ideas]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ideas.filter((i) => {
      const matchesCat = cat === 'All' || i.category === cat;
      const hay = `${i.title} ${i.tagline} ${i.impact}`.toLowerCase();
      return matchesCat && (!q || hay.includes(q));
    });
  }, [ideas, search, cat]);

  const isBlurred = (idea: Idea) => idea.protected && !accessSet.has(idea.id);

  const clueByCategory: Record<string, string> = {
    'Smart Security & Tech': 'Smart security or automation concept.',
    'Eco & Sustainability': 'Eco-friendly solution reducing waste.',
    'Home & Lifestyle': 'Lifestyle improvement idea.',
    'Mobility & Safety': 'Transportation or safety innovation.',
    General: 'Innovative problem-solving concept.',
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
    router.refresh();
  };

  return (
    <main className="min-h-screen px-6 py-12 bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white">
      {/* NAV BAR */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-400">
            Global Bank of Unique Ideas
          </h1>
          <p className="text-white/60 text-sm">
            Explore protected innovations. NDA required for full access.
          </p>
        </div>

        <div className="flex gap-2">
          {!userId ? (
            <>
              <button
                onClick={() => router.push('/login')}
                className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-black"
              >
                Log in
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="rounded-full border border-emerald-400 px-5 py-2 text-sm text-emerald-300"
              >
                Sign up
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="rounded-full border border-white/20 px-5 py-2 text-sm"
            >
              Log out
            </button>
          )}
        </div>
      </div>

      {/* FILTERS */}
      <div className="max-w-6xl mx-auto flex gap-2 mb-6 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ideas..."
          className="px-4 py-2 rounded-md bg-neutral-800 border border-neutral-700"
        />

        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3 py-2 text-xs rounded-md border ${
              cat === c ? 'border-white/40 bg-white/10' : 'border-white/15'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* IDEAS GRID */}
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((idea) => {
          const blurred = isBlurred(idea);
          const clue = clueByCategory[idea.category] || clueByCategory.General;

          return (
            <div
              key={idea.id}
              onMouseMove={(e) => {
                if (!blurred) return;
                setTooltip({
                  text: clue,
                  x: e.clientX + 14,
                  y: e.clientY + 14,
                  visible: true,
                });
              }}
              onMouseLeave={() =>
                setTooltip((t) => ({ ...t, visible: false }))
              }
              className="relative p-6 bg-neutral-900 border border-neutral-800 rounded-xl"
            >
              <h2
                className={`text-xl font-semibold text-emerald-300 ${
                  blurred ? 'blur-sm select-none' : ''
                }`}
              >
                {idea.title}
              </h2>

              <p className={`mt-2 ${blurred ? 'blur-sm select-none' : ''}`}>
                {idea.tagline}
              </p>

              <p className={`text-sm mt-2 text-white/60 ${blurred ? 'blur-sm' : ''}`}>
                {idea.impact}
              </p>

              {blurred && (
                <button
                  onClick={() => {
                    setSelectedIdea({ id: idea.id, title: idea.title });
                    setNdaOpen(true);
                  }}
                  className="mt-4 bg-white text-black px-3 py-1.5 rounded text-sm"
                >
                  Request NDA
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* CENTERED AUTH CTA */}
      <div className="mt-12 text-center text-white/80">
        <p>
          Do you have an account?{' '}
          <Link href="/login" className="text-emerald-300 underline font-semibold">
            Log in here
          </Link>
        </p>
        <p className="mt-2">
          New Inventor or Investor?{' '}
          <Link href="/signup" className="text-emerald-300 underline font-semibold">
            Sign up here
          </Link>
        </p>
      </div>

      {/* TOOLTIP */}
      {tooltip.visible && (
        <div
          style={{ left: tooltip.x, top: tooltip.y }}
          className="fixed z-50 max-w-xs rounded-lg border border-white/20 bg-black/80 px-3 py-2 text-xs text-white backdrop-blur"
        >
          <strong>Clue:</strong> {tooltip.text}
        </div>
      )}

      {/* NDA MODAL */}
      {selectedIdea && (
        <NdaModal
          open={ndaOpen}
          onClose={() => setNdaOpen(false)}
          ideaId={selectedIdea.id}
          ideaTitle={selectedIdea.title}
        />
      )}
    </main>
  );
}