'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type ProfileRow = {
  id: string;
  role: string | null;
  full_name: string | null;
};

type IdeaDetailRow = {
  id: string;
  title: string | null;
  category: string | null;
  status: string | null;
  protected: boolean | null;
  created_at: string | null;
};

type IdeaAccessRow = {
  id: string;
  status: string | null;
  unblur_until: string | null;
};

export default function InvestorIdeaDetailPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const ideaId = params.id;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [idea, setIdea] = useState<IdeaDetailRow | null>(null);
  const [access, setAccess] = useState<IdeaAccessRow | null>(null);

  useEffect(() => {
    if (!ideaId) return;
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
          (prof?.role ??
            (user.user_metadata as any)?.role ??
            'investor') as string;

        if (role !== 'investor') {
          router.replace('/');
          return;
        }

        // 3) Load this idea
        const { data: ideaRow, error: ideaErr } = await supabase
          .from('ideas')
          .select('id, title, category, status, protected, created_at')
          .eq('id', ideaId)
          .maybeSingle<IdeaDetailRow>();

        if (ideaErr) throw ideaErr;
        if (!ideaRow) {
          throw new Error('Idea not found.');
        }

        // 4) If protected, check access (latest NDA request for this investor)
        let accessRow: IdeaAccessRow | null = null;
        if (ideaRow.protected) {
          const { data: acc, error: accErr } = await supabase
            .from('nda_requests')
            .select('id, status, unblur_until')
            .eq('idea_id', ideaId)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle<IdeaAccessRow>();

          if (accErr) {
            console.warn('Access check error:', accErr.message);
          } else {
            accessRow = acc ?? null;
          }
        }

        if (!cancelled) {
          setIdea(ideaRow);
          setAccess(accessRow);
        }
      } catch (e: any) {
        console.error(e);
        if (!cancelled) setErr(e?.message || 'Failed to load idea.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, router, ideaId]);

  // ✅ Time-limited access check
  const hasActiveAccess = (() => {
    if (!access || access.status !== 'approved') return false;
    if (!access.unblur_until) return true; // unlimited access (future option)

    const now = new Date();
    const until = new Date(access.unblur_until);
    return until > now;
  })();

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white px-6 pt-24 pb-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-300/80">
              Investor View
            </p>
            <h1 className="text-2xl font-extrabold text-emerald-300">
              Idea Detail
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/investor/ideas"
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs hover:bg-white/10"
            >
              ← Back to ideas
            </Link>
            <Link
              href="/investor"
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs hover:bg-white/10"
            >
              Investor dashboard
            </Link>
          </div>
        </div>

        {loading && <p className="text-white/70">Loading idea…</p>}

        {err && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">
            {err}
          </div>
        )}

        {!loading && !err && !idea && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/70">
            Idea not found.
          </div>
        )}

        {!loading && !err && idea && (
          <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-6 shadow-lg shadow-black/40">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white/95">
                  {idea.title || 'Untitled idea'}
                </h2>
                <p className="mt-1 text-xs text-emerald-300">
                  {idea.category || 'General'} ·{' '}
                  {idea.created_at
                    ? new Date(idea.created_at).toLocaleDateString()
                    : ''}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-200 ring-1 ring-emerald-500/30">
                  {idea.status || 'confirmed'}
                </span>
                {idea.protected && (
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-semibold text-amber-200 ring-1 ring-amber-500/30">
                    🔒 Protected
                  </span>
                )}
              </div>
            </div>

            {/* Content area */}
            {idea.protected && !hasActiveAccess ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-white/75">
                  This is a <span className="font-semibold">protected idea</span>.
                  Your NDA request has not been approved yet, so the full brief is
                  still hidden.
                </p>

                <div className="rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-white/60 backdrop-blur-sm">
                  <p className="mb-2 text-xs uppercase tracking-wide text-white/50">
                    Preview (blurred)
                  </p>
                  <div className="h-24 rounded-md bg-gradient-to-r from-white/10 via-white/5 to-white/10 blur-sm" />
                </div>

                <p className="text-xs text-white/70">
                  Once the admin approves your NDA request, this page will
                  automatically show the full brief during your access window
                  while you are logged in.
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-white/80">
                  Full brief placeholder. Once we wire the full idea fields
                  (problem / solution / market / etc.), they will be displayed
                  here for investors who have access.
                </p>

                <div className="rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-white/75">
                  <p className="mb-1 text-xs uppercase tracking-wide text-white/50">
                    Idea summary
                  </p>
                  <p>
                    This is where the inventor&apos;s summary or description will be
                    rendered from the <code>ideas</code> table.
                  </p>
                </div>

                {access && access.status === 'approved' && access.unblur_until && (
                  <p className="text-[11px] text-emerald-300">
                    Access expires on{' '}
                    {new Date(access.unblur_until).toLocaleString()}.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}