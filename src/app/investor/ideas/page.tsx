'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { NDAStatus } from '@/lib/types';

type IdeaRow = {
  id: string;
  title: string | null;
  tagline: string | null;
  category: string | null;
  status: NDAStatus | null;
  protected: boolean | null;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  role: string | null;
  full_name: string | null;
};

type NdaSession = {
  ok: boolean;
  hasToken?: boolean;
  unlockedIdeaIds?: string[];
  unblurUntil?: string | null;
  ndaStatus?: string;
  error?: string;
};

export default function InvestorIdeasPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');

  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // NDA access session state (from httpOnly cookie via /api/nda/session)
  const [accessLoading, setAccessLoading] = useState(false);
  const [unlockedIdeaIds, setUnlockedIdeaIds] = useState<Set<string>>(new Set());
  const [unblurUntil, setUnblurUntil] = useState<string | null>(null);
  const [ndaStatus, setNdaStatus] = useState<string | null>(null);

  const refreshAccess = useCallback(async () => {
    setAccessLoading(true);
    try {
      const res = await fetch('/api/nda/session', { method: 'GET', cache: 'no-store' });
      const data: NdaSession = await res.json().catch(() => ({} as any));

      if (!res.ok || !data?.ok) {
        setNdaStatus(null);
        setUnblurUntil(null);
        setUnlockedIdeaIds(new Set());
        return;
      }

      const ids = Array.isArray(data.unlockedIdeaIds) ? data.unlockedIdeaIds : [];
      setUnlockedIdeaIds(new Set(ids));
      setUnblurUntil(data.unblurUntil ?? null);
      setNdaStatus(data.ndaStatus ?? null);
    } finally {
      setAccessLoading(false);
    }
  }, []);

  // ---- load ideas for investors only ----
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        // 1) Must be logged in
        const { data: auth, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;

        const user = auth.user;
        if (!user) {
          router.replace('/login');
          return;
        }

        // 2) Must be investor
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('id, role, full_name')
          .eq('id', user.id)
          .maybeSingle<ProfileRow>();

        if (profErr) throw profErr;

        const role = (prof?.role ?? (user.user_metadata as any)?.role ?? 'investor') as string;

        if (role !== 'investor') {
          router.replace('/');
          return;
        }

        // 3) Load confirmed ideas only
        const { data, error } = await supabase
          .from('ideas')
          .select('id, title, tagline, category, status, protected, created_at')
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

  // Auto-check access on page load (cookie is httpOnly, so we ask the server)
  useEffect(() => {
    refreshAccess();
  }, [refreshAccess]);

  // ---- Request NDA ----
  async function requestNDA(ideaId: string) {
    try {
      setRequestingId(ideaId);
      setErr(null);
      setToast(null);

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;

      const user = session?.user;
      if (!user) {
        router.replace('/login');
        return;
      }

      const res = await fetch('/api/nda/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaId,
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.error || 'Failed to request NDA');
        return;
      }

      setToast(data?.message || '✅ NDA request sent. Admin will review it.');
      alert(data?.message || '✅ NDA request sent. Admin will review it.');
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Failed to request NDA');
    } finally {
      setRequestingId(null);
    }
  }

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
      const hay = `${i.title ?? ''} ${i.tagline ?? ''} ${catLabel}`.toLowerCase();
      const matchesSearch = !q || hay.includes(q);
      return matchesCat && matchesSearch;
    });
  }, [ideas, search, cat]);

  const accessBanner = useMemo(() => {
    if (!ndaStatus) return null;

    if (ndaStatus === 'verified' && unblurUntil) {
      return `✅ Access active until ${new Date(unblurUntil).toLocaleString()}`;
    }
    if (ndaStatus === 'signed') return '📩 Signed NDA received. Waiting for admin approval…';
    if (ndaStatus === 'approved') return '✅ NDA request approved. Please upload your signed NDA.';
    if (ndaStatus === 'rejected') return '❌ NDA request rejected.';
    return `ℹ️ NDA status: ${ndaStatus}`;
  }, [ndaStatus, unblurUntil]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white px-6 pt-24 pb-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-emerald-300">Investor Ideas</h1>
            <p className="text-white/70 mt-1">
              Browse confirmed ideas. Protected briefs require NDA approval.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={refreshAccess}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-60"
              disabled={accessLoading}
              title="If you just received an access email, click this."
            >
              {accessLoading ? 'Refreshing…' : 'Refresh access'}
            </button>

            <Link
              href="/investor"
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Access banner */}
        {accessBanner && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
            {accessBanner}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-200">
            {toast}
          </div>
        )}

        {/* Search + category */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas..."
            className="w-64 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          />

          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          >
            {cats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
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
            {filtered.map((idea) => {
              const isProtected = !!idea.protected;
              const isUnlocked = unlockedIdeaIds.has(idea.id);
              const shouldBlur = isProtected && !isUnlocked;

              return (
                <div
                  key={idea.id}
                  className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-lg shadow-black/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-white/95 break-words">
                      {shouldBlur ? (
                        <span className="inline-block blur-sm select-none">
                          {idea.title ?? 'Protected Idea'}
                        </span>
                      ) : (
                        idea.title ?? 'Untitled'
                      )}
                    </h2>

                    <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30">
                      Confirmed
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-emerald-300">{idea.category ?? 'General'}</p>

                  <p className="mt-2 text-xs text-white/70">
                    {shouldBlur ? (
                      <span className="inline-block blur-sm select-none">
                        {idea.tagline ?? 'This brief is protected and requires NDA.'}
                      </span>
                    ) : (
                      idea.tagline ?? '—'
                    )}
                  </p>

                  <p className="mt-3 text-xs text-white/60">
                    {idea.created_at ? new Date(idea.created_at).toLocaleDateString() : ''}
                  </p>

                  {/* ✅ STEP 1: No "Open" button here anymore */}
                 <div className="mt-4 flex items-center justify-between">
  {/* LEFT SIDE CTA */}
  {isProtected ? (
    isUnlocked ? (
      // ✅ Access granted → show ONLY this CTA (no Open button)
      <Link
        href={`/investor/contact?ideaId=${encodeURIComponent(idea.id)}`}
        className="text-xs rounded-full border border-white/20 bg-white/10 px-3 py-1.5 hover:bg-white/15"
      >
        Request Full Brief / Start Discussion
      </Link>
    ) : (
      // 🔒 Not unlocked → keep Request NDA
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          requestNDA(idea.id);
        }}
        disabled={requestingId === idea.id}
        className="text-xs rounded-full border border-white/20 bg-white/10 px-3 py-1.5 hover:bg-white/15 disabled:opacity-60"
      >
        {requestingId === idea.id ? 'Requesting…' : 'Request NDA'}
      </button>
    )
  ) : (
    // ✅ Not protected → treat as already “unblurred” → show the same CTA (still no Open button)
    <Link
      href={`/investor/contact?ideaId=${encodeURIComponent(idea.id)}`}
      className="text-xs rounded-full border border-white/20 bg-white/10 px-3 py-1.5 hover:bg-white/15"
    >
      Request Full Brief / Start Discussion
    </Link>
  )}

  {/* RIGHT SIDE STATUS LABEL */}
  {isProtected ? (
    <span className="text-[11px] text-white/50">
      {isUnlocked ? '✅ Access granted' : '🔒 NDA required'}
    </span>
  ) : (
    <span className="text-[11px] text-white/50">✅ Available</span>
  )}
</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}