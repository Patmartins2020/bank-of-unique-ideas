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
  clue?: string | null;
};

export default function Home() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [accessSet, setAccessSet] = useState<Set<string>>(new Set());

  const [ndaOpen, setNdaOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<{ id: string; title: string } | null>(null);

  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
    visible: boolean;
  }>({ text: '', x: 0, y: 0, visible: false });

  const [activeClueId, setActiveClueId] = useState<string | null>(null);

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
          .select('id,title,tagline,impact,category,status,protected,clue,created_at')
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
          clue: r.clue ?? null,
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

  useEffect(() => {
    const stored = localStorage.getItem('ndaRedirect');
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (parsed?.ideaId && parsed?.ideaTitle) {
        setSelectedIdea({
          id: parsed.ideaId,
          title: parsed.ideaTitle,
        });
        setNdaOpen(true);
      }
    } catch (err) {
      console.error('Invalid ndaRedirect data');
    } finally {
      localStorage.removeItem('ndaRedirect');
    }
  }, []);

  const cats = useMemo(
    () => ['All', ...Array.from(new Set(ideas.map((i) => i.category)))],
    [ideas]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ideas.filter((i) => {
      const matchesCat = cat === 'All' || i.category === cat;
      const hay = `${i.title} ${i.tagline} ${i.impact} ${i.clue ?? ''}`.toLowerCase();
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

  const openNda = async (idea: Idea) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      localStorage.setItem(
        'ndaRedirect',
        JSON.stringify({
          ideaId: idea.id,
          ideaTitle: idea.title,
        })
      );

      window.location.href = '/login';
      return;
    }

    setSelectedIdea({ id: idea.id, title: idea.title });
    setNdaOpen(true);
  };

  function generateClue(idea: Idea) {
    if (idea.clue && idea.clue.trim()) return idea.clue.trim();

    const text = `${idea.tagline || ''} ${idea.impact || ''}`.trim();
    if (!text) return clueByCategory[idea.category] || clueByCategory.General;

    const cleaned = text
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(' ')
      .slice(0, 12)
      .join(' ');

    return cleaned || clueByCategory[idea.category] || clueByCategory.General;
  }

  return (
    <main className="min-h-screen px-6 py-12 bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white">
      <div className="max-w-6xl mx-auto">
        <section className="mb-10 rounded-2xl border border-emerald-400/20 bg-white/[0.03] p-6 md:p-10">
          <div className="max-w-3xl">
            <p className="text-emerald-300 text-sm font-semibold tracking-wide uppercase">
              Protected Innovation Marketplace
            </p>

            <h1 className="mt-3 text-4xl md:text-5xl font-extrabold leading-tight text-white">
              Share Your Idea Without Fear
            </h1>

            <p className="mt-4 text-white/75 text-base md:text-lg leading-relaxed">
              Submit your idea, keep it protected, and let only approved viewers access the full details.
              Turn ideas into protected assets before exposing them to the world.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/submit"
               className="px-5 py-3 rounded-full border border-white/15 bg-white/5 text-white font-semibold hover:bg-white/10 transition"
              >
                🔐 Submit & Protect My Idea
              </Link>

              <a
                href="#ideas-grid"
                className="px-5 py-3 rounded-full border border-white/15 bg-white/5 text-white font-semibold hover:bg-white/10 transition"
              >
                🔍 Explore Ideas
              </a>
            </div>
          </div>
        </section>

        <section className="mb-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-emerald-300 font-semibold">✔ Blurred Protection</p>
            <p className="mt-2 text-sm text-white/70">
              Your idea can remain partially hidden to reduce the risk of copying.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-emerald-300 font-semibold">✔ NDA-Controlled Access</p>
            <p className="mt-2 text-sm text-white/70">
              Interested viewers request NDA access before seeing sensitive details.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-emerald-300 font-semibold">✔ Verifiable Records</p>
            <p className="mt-2 text-sm text-white/70">
              Every protected idea can be tied to traceable records and certificates.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-extrabold text-emerald-400">
            Explore Protected Innovations
          </h2>
          <p className="text-white/60 text-sm mt-1">
            Browse confirmed ideas. NDA may be required for full access.
          </p>
        </section>

        <section className="mb-6">
          {loading && <p className="text-sm text-white/70">Loading ideas…</p>}
          {loadErr && <p className="text-sm text-rose-300">{loadErr}</p>}
          {!loading && !loadErr && ideas.length === 0 && (
            <p className="text-sm text-white/70">No ideas yet.</p>
          )}
        </section>

        <section className="flex gap-2 mb-6 flex-wrap">
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
        </section>

        <section id="ideas-grid" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((idea) => {
            const blurred = isBlurred(idea);
            const clue = generateClue(idea);

            return (
              <div
                key={idea.id}
                className="relative group p-6 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-emerald-400/40 transition"
                onClick={() => {
                  if (!blurred) return;
                  setActiveClueId((prev) => (prev === idea.id ? null : idea.id));
                }}
                onMouseMove={(e) => {
                  if (!blurred || window.innerWidth < 768) return;
                  setTooltip({
                    text: clue,
                    x: e.clientX + 14,
                    y: e.clientY + 14,
                    visible: true,
                  });
                }}
                onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
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

                <div className={`transition duration-300 ${blurred ? 'blur-sm opacity-70 select-none' : ''}`}>
                  <h3 className="text-xl font-semibold text-emerald-300">{idea.title}</h3>
                  <p className="mt-2 text-sm text-white/80">{idea.tagline}</p>
                  <p className="text-sm mt-2 text-white/60">{idea.impact}</p>
                </div>

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
                      Tap or hover to reveal a protected clue.
                    </p>
                  </div>
                )}

                {blurred && activeClueId === idea.id && (
                  <div className="mt-3 text-xs text-white/90 bg-black/80 border border-white/20 rounded-lg p-3">
                    <strong>🔐 Clue:</strong> {clue}
                  </div>
                )}

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
        </section>

        {tooltip.visible && window.innerWidth >= 768 && (
          <div
            style={{ left: tooltip.x, top: tooltip.y }}
            className="fixed z-50 max-w-xs rounded-lg border border-white/20 bg-black/80 px-3 py-2 text-xs text-white backdrop-blur"
          >
            <strong>Clue:</strong> {tooltip.text}
          </div>
        )}

        {selectedIdea && (
          <NdaModal
            open={ndaOpen}
            onClose={() => setNdaOpen(false)}
            ideaId={selectedIdea.id}
            ideaTitle={selectedIdea.title}
          />
        )}

        {!userId && (
          <section className="mt-12 text-center text-white/80">
            <p>
              Ready to protect your own idea?{' '}
              <Link href="/signup" className="text-emerald-300 underline font-semibold">
                Sign up here
              </Link>
            </p>
            <p className="mt-2">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-300 underline font-semibold">
                Log in here
              </Link>
            </p>
          </section>
        )}

        <div className="mt-8 text-center text-xs text-white/50">
          <Link href="/legal/terms" className="underline hover:text-white/70">
            Terms & Confidentiality
          </Link>
        </div>
      </div>
    </main>
  );
}