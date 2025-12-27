'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type IdeaRow = {
  id: string;
  title: string | null;
  status: string | null;
  protected: boolean | null;
  created_at: string | null;
};

type ProfileRow = {
  role: string | null;
};

export default function MyIdeasPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        // 1) Get current user
        const {
          data: { user },
          error: authErr,
        } = await supabase.auth.getUser();

        if (authErr) {
          console.error('my-ideas getUser error:', authErr);
          router.replace('/login');
          return;
        }

        if (!user) {
          router.replace('/login');
          return;
        }

        const userId = user.id;

        // 2) Check role (profile first, then metadata)
        let role: string | undefined =
          (user.user_metadata as any)?.role ?? undefined;

        try {
          const { data: prof, error: profErr } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .maybeSingle<ProfileRow>();

          if (!profErr && prof?.role) {
            role = prof.role;
          }
        } catch (e) {
          console.warn('my-ideas: could not load profile role, using metadata.');
        }

        if (!role) role = 'inventor';

        // 3) Redirect non-inventors away from this page
        if (role === 'investor') {
          router.replace('/investor/ideas');
          return;
        }
        if (role === 'admin') {
          router.replace('/admin');
          return;
        }

        // 4) Load this inventor's ideas
        const { data, error } = await supabase
          .from('ideas')
          .select('id, title, status, protected, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!cancelled) {
          setIdeas((data ?? []) as IdeaRow[]);
        }
      } catch (e: any) {
        console.error(e);
        if (!cancelled) setErr(e?.message || 'Failed to load your ideas.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  const counts = useMemo(() => {
    const pending = ideas.filter((i) => i.status === 'pending').length;
    const confirmed = ideas.filter((i) => i.status === 'confirmed').length;
    const blocked = ideas.filter((i) => i.status === 'blocked').length;
    return { pending, confirmed, blocked };
  }, [ideas]);

  // 🔹 Logout logic
  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('logout error:', e);
    } finally {
      router.replace('/login');
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white px-6 pt-24 pb-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-emerald-300">
              My Ideas
            </h1>
            <p className="text-white/70 mt-1">
              Only you and approved parties can view these ideas.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/idea"
              className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300"
            >
              Submit another idea
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Back home
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-red-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-3">
          <span className="rounded-full bg-white/5 px-4 py-1.5 text-xs">
            Pending {counts.pending}
          </span>
          <span className="rounded-full bg-white/5 px-4 py-1.5 text-xs">
            Confirmed {counts.confirmed}
          </span>
          <span className="rounded-full bg-white/5 px-4 py-1.5 text-xs">
            Blocked {counts.blocked}
          </span>
        </div>

        {loading && <p className="text-white/70">Loading your ideas…</p>}
        {err && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">
            {err}
          </div>
        )}

        {!loading && !err && ideas.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
            No ideas yet. Click “Submit another idea” to add your first.
          </div>
        )}

        {!loading && !err && ideas.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-lg shadow-black/30"
              >
                <h2 className="text-lg font-semibold text-white/95 break-words">
                  {idea.title ?? 'Untitled'}
                </h2>
                <p className="mt-1 text-xs text-emerald-300">
                  {idea.status ?? 'pending'}
                  {idea.protected ? ' · 🔒 protected' : ''}
                </p>
                <p className="mt-2 text-xs text-white/60">
                  {idea.created_at
                    ? new Date(idea.created_at).toLocaleDateString()
                    : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}