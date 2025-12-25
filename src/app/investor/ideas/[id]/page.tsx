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
  status: string | null;        // 'requested' | 'approved' | 'rejected' | ...
  unblur_until: string | null;  // timestamptz in DB, ISO string here
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

        // 4) If protected, check the latest NDA request for this investor + idea
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

  // ✅ Time-limited access logic (Option B)
  const hasActiveAccess = (() => {
    if (!access || access.status !== 'approved') return false;

    // no expiry set = unlimited access
    if (!access.unblur_until) return true;

    const now = new Date();
    const until = new Date(access.unblur_until);
    return until > now;
  })();

  // Optional helper text based on NDA status
  const accessLabel = (() => {
    if (!access) return 'No NDA on file yet.';
    if (access.status === 'requested') return 'NDA requested – awaiting review.';
    if (access.status === 'rejected') return 'NDA request was not approved.';
    if (access.status === 'approved') {
      if (!access.unblur_until) return 'NDA approved – full access granted.';
      const until = new Date(access.unblur_until);
      if (until > new Date()) {
        return `NDA approved – access valid until ${until.toLocaleString()}.`;
      }
      return 'NDA access expired – please request a renewal if needed.';
    }
    return `NDA status: ${access.status}`;
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

            {/* NDA status hint (optional UI) */}
            {idea.protected && (
              <p className="text-xs text-white/60">{accessLabel}</p>
            )}

            {/* Content area */}
            {idea.protected && !hasActiveAccess ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-white/75">
                  This is a <span className="font-semibold">protected idea</span>.
                  To respect the inventor&apos;s confidentiality, the full brief is
                  hidden until your NDA is approved.
                </p>

                <div className="rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-white/60 backdrop-blur-sm">
                  <p className="mb-2 text-xs uppercase tracking-wide text-white/50">
                    Preview (blurred)
                  </p>
                  <div className="h-24 rounded-md bg-gradient-to-r from-white/10 via-white/5 to-white/10 blur-sm" />
                </div>

                <p className="text-xs text-white/70">
                  To proceed, please return to the home page and request an NDA
                  for this idea. Once your request is approved, this page will
                  automatically show the full brief when you are logged in with
                  this investor account.
                </p>

                <Link
                  href="/"
                  className="inline-flex items-center rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-300"
                >
                  Go to home page to request / renew NDA
                </Link>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-white/80">
                  Full brief placeholder. Once we wire the full idea fields
                  (problem / solution / market / etc.), they will be displayed
                  here for investors who have an active NDA for this idea.
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
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}