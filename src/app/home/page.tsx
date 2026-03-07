'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
        if (!cancelled) setLoadErr(e?.message || 'Failed to load ideas.');
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

  // IMPORTANT: keep your original logic
  const isBlurred = (idea: Idea) => idea.protected && !accessSet.has(idea.id);

  const clueByCategory: Record<string, string> = {
    'Smart Security & Tech': 'Smart security or automation concept.',
    'Eco & Sustainability': 'Eco-friendly solution reducing waste.',
    'Home & Lifestyle': 'Lifestyle improvement idea.',
    'Mobility & Safety': 'Transportation or safety innovation.',
    General: 'Innovative problem-solving concept.',
  };

  const openNda = (idea: Idea) => {
    setSelectedIdea({ id: idea.id, title: idea.title });
    setNdaOpen(true);
  };

  return (
    <main className="min-h-screen px-6 py-12 bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white">
      {/* PAGE HEADER (no CTA buttons here — navbar handles that) */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-extrabold text-emerald-400">
          Global Bank of Unique Ideas
        </h1>
        <p className="text-white/60 text-sm mt-1">
          Explore protected innovations. NDA required for full access.
        </p>
      </div>

      {/* STATUS */}
      <div className="max-w-6xl mx-auto mb-6">
        {loading && <p className="text-sm text-white/70">Loading ideas…</p>}
        {loadErr && <p className="text-sm text-rose-300">{loadErr}</p>}
        {!loading && !loadErr && ideas.length === 0 && (
          <p className="text-sm text-white/70">No ideas yet.</p>
        )}
      </div>

      {/* FILTERS */}
      <div className="max-w-6xl mx-auto flex gap-2 mb-6 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ideas..."
          className="px-4 py-2 rounded-md bg-neutral-800 border border-neutral-700 outline-none focus:border-white/30"
        />

        {cats.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={`px-3 py-2 text-xs rounded-md border transition ${
              cat === c ? 'border-white/40 bg-white/10' : 'border-white/15 hover:border-white/25 hover:bg-white/5'
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
              className="relative group p-6 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-emerald-400/40 transition"
              onMouseMove={(e) => {
                if (!blurred) return;
                setTooltip({
                  text: clue,
                  x: e.clientX + 14,
                  y: e.clientY + 14,
                  visible: true,
                });
              }}
              onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
            >
              {/* CHIPS */}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 bg-white/5 text-white/70">
                  {idea.category}
                </span>

                {blurred ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-300/30 bg-amber-500/10 text-amber-200">
                    NDA Protected
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-300/20 bg-emerald-500/10 text-emerald-200">
                    Accessible
                  </span>
                )}
              </div>

              {/* CONTENT */}
              <div className={`transition duration-300 ${blurred ? 'blur-sm opacity-70 select-none' : ''}`}>
                <h2 className="text-xl font-semibold text-emerald-300">{idea.title}</h2>
                <p className="mt-2 text-sm text-white/80">{idea.tagline}</p>
                <p className="text-sm mt-2 text-white/60">{idea.impact}</p>
              </div>

              {/* OVERLAY */}
              {blurred && (
                <div
                  className="
                    absolute inset-0 flex flex-col justify-center items-center
                    bg-black/55 backdrop-blur-sm
                    rounded-xl
                    opacity-0 group-hover:opacity-100 transition duration-300
                    pointer-events-none group-hover:pointer-events-auto
                    px-5 text-center
                  "
                >
                  <div className="text-3xl animate-pulse mb-2">🔒</div>

                  <p className="text-sm font-semibold text-emerald-300">Confidential Innovation</p>

                  <p className="text-xs text-white/80 mt-1 max-w-[260px]">
                    This idea is blurred to prevent IP theft. Request NDA access to view full details.
                  </p>

                  <button
                    type="button"
                    onClick={() => openNda(idea)}
                    className="mt-3 px-4 py-2 rounded-md bg-emerald-400 text-black text-xs font-semibold hover:bg-emerald-300 transition"
                  >
                    Request NDA Access
                  </button>

                  <p className="mt-2 text-[11px] text-white/60">
                    Tip: move your mouse here to see a small clue.
                  </p>
                </div>
              )}

              {/* FALLBACK BUTTON */}
              {blurred && (
                <button
                  type="button"
                  onClick={() => openNda(idea)}
                  className="mt-4 bg-white text-black px-3 py-1.5 rounded text-sm hover:opacity-90 transition"
                >
                  Request NDA
                </button>
              )}
            </div>
          );
        })}
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

      {/* ✅ SINGLE CTA TEXT BLOCK (links only, not buttons) */}
      {!userId && (
        <div className="max-w-6xl mx-auto mt-12 text-center text-white/80">
          <p>
            Are you an investor or inventor?{' '}
            <Link href="/signup" className="text-emerald-300 underline font-semibold">
              Sign up here
            </Link>
          </p>
          <p className="mt-2">
            Do you already have an account?{' '}
            <Link href="/login" className="text-emerald-300 underline font-semibold">
              Log in here
            </Link>
          </p>
        </div>
      )}

      {/* FOOTER */}
      <div className="max-w-6xl mx-auto mt-8 text-center text-xs text-white/50">
        <Link href="/legal/terms" className="underline hover:text-white/70">
          Terms & Confidentiality
        </Link>
      </div>
    </main>
  );
}