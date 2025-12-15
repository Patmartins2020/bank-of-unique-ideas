'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type IdeaStatus = 'pending' | 'viewed' | 'confirmed' | 'blocked' | 'deleted' | string;

type IdeaRow = {
  id: string;
  title: string | null;
  category: string | null;
  tagline: string | null;
  impact: string | null;
  status: IdeaStatus | null;
  created_at?: string | null;
};

export default function MyIdeasPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState<string>('Inventor');
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      // 1) Must be logged in
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;

      if (!user) {
        router.replace('/login');
        return;
      }

      // 2) Must be inventor
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();

      if (profErr) {
        if (!cancelled) {
          setError('Failed to load profile.');
          setLoading(false);
        }
        return;
      }

      const role = prof?.role ?? 'inventor';
      const fullName = prof?.full_name ?? 'Inventor';

      if (role !== 'inventor') {
        router.replace('/');
        return;
      }

      if (!cancelled) setProfileName(fullName);

      // 3) Fetch ONLY this user’s ideas (requires ideas.user_id column)
      const { data: ideaRows, error: ideasErr } = await supabase
        .from('ideas')
        .select('id,title,category,tagline,impact,status,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (ideasErr) {
        setError(
          ideasErr.message?.includes('user_id')
            ? 'Missing "user_id" column on ideas table. Add it in Supabase to enable inventor-only vault.'
            : ideasErr.message || 'Failed to load ideas.'
        );
        setIdeas([]);
      } else {
        setIdeas((ideaRows ?? []) as IdeaRow[]);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  const counts = useMemo(() => {
    const pending = ideas.filter((i) => (i.status ?? 'pending') === 'pending').length;
    const confirmed = ideas.filter((i) => (i.status ?? '') === 'confirmed').length;
    const blocked = ideas.filter((i) => (i.status ?? '') === 'blocked').length;
    return { pending, confirmed, blocked };
  }, [ideas]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white px-6 pt-24 pb-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-emerald-300">My Ideas</h1>
          <p className="text-white/70">
            Welcome, <span className="text-white font-semibold">{profileName}</span> —{' '}
            <span className="italic">Only you and approved parties can view these ideas.</span>
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-2 pt-2">
            <StatPill label="Pending" value={counts.pending} />
            <StatPill label="Confirmed" value={counts.confirmed} />
            <StatPill label="Blocked" value={counts.blocked} />
          </div>
        </div>

        {/* State */}
        {loading && <p className="text-white/70">Loading your vault…</p>}
        {error && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && ideas.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-lg font-semibold text-white/90">You haven’t submitted any ideas yet.</p>
            <p className="mt-1 text-sm text-white/60">Your ideas are protected and visible only to you.</p>

            <Link
              href="/submit"
              className="inline-block mt-5 rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-black hover:bg-emerald-300"
            >
              ➕ Submit a New Idea
            </Link>
          </div>
        )}

        {/* Ideas list */}
        {!loading && !error && ideas.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideas.map((idea) => {
              const status = (idea.status ?? 'pending') as IdeaStatus;

              return (
                <div
                  key={idea.id}
                  className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-lg shadow-black/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-white/95 break-words">
                      {idea.title ?? 'Untitled idea'}
                    </h2>
                    <StatusBadge status={status} />
                  </div>

                  <p className="mt-1 text-xs text-emerald-300">{idea.category ?? 'Uncategorized'}</p>

                  {idea.tagline && (
                    <p className="mt-2 text-sm text-white/80 break-words">{idea.tagline}</p>
                  )}

                  <p className="mt-2 text-xs text-white/60 break-words line-clamp-3">
                    {idea.impact ?? '—'}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-white/50">
                      {idea.created_at ? new Date(idea.created_at).toLocaleDateString() : ''}
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/my-ideas/${idea.id}`}
                        className="text-xs rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/15"
                      >
                        View
                      </Link>

                      {status === 'pending' && (
                        <Link
                          href={`/my-ideas/${idea.id}/edit`}
                          className="text-xs rounded-full bg-emerald-400 px-3 py-1.5 font-semibold text-black hover:bg-emerald-300"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer nav */}
        <div className="pt-4 flex gap-4 text-sm">
          <Link className="text-emerald-300 underline" href="/submit">
            Submit another idea
          </Link>
          <Link className="text-white/70 underline" href="/">
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'confirmed'
      ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
      : status === 'viewed'
      ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'
      : status === 'blocked'
      ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30'
      : status === 'deleted'
      ? 'bg-gray-500/15 text-gray-300 ring-1 ring-gray-500/30'
      : 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30';

  const label =
    status === 'confirmed'
      ? 'Confirmed'
      : status === 'viewed'
      ? 'Viewed'
      : status === 'blocked'
      ? 'Blocked'
      : status === 'deleted'
      ? 'Deleted'
      : 'Pending';

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
      <span className="text-white/60">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </span>
  );
}