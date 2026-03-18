'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { NDAStatus } from '@/lib/types';

type IdeaRow = {
  id: string;
  title: string | null;
 status: 'pending' | 'confirmed' | 'blocked' | null;
  protected: boolean | null;
  created_at: string | null;
  notified?: boolean | null; // ✅ added
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

  // 🔥 reusable loader (important for refresh)
  async function loadIdeas(userId: string) {
    const { data, error } = await supabase
      .from('ideas')
      .select('id, title, status, protected, created_at, notified')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setIdeas((data ?? []) as IdeaRow[]);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace('/login');
          return;
        }

        const userId = user.id;

        let role: string | undefined =
          (user.user_metadata as any)?.role ?? undefined;

        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle<ProfileRow>();

        if (prof?.role) role = prof.role;

        if (!role) role = 'inventor';

        if (role === 'investor') {
          router.replace('/investor/ideas');
          return;
        }
        if (role === 'admin') {
          router.replace('/admin');
          return;
        }

        await loadIdeas(userId);
      } catch (e: any) {
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

  // ✅ COUNTS
  const counts = useMemo(() => {
   const pending = ideas.filter((i) => i.status === 'pending').length;
const confirmed = ideas.filter((i) => i.status === 'confirmed').length;
const blocked = ideas.filter((i) => i.status === 'blocked').length;

    return { pending, confirmed, blocked };
  }, [ideas]);

  // 🔥 POPUP + NOTIFICATION SYSTEM (FIXED SAFE VERSION)
  useEffect(() => {
    const run = async () => {
      const confirmedUnnotified = ideas.filter(
        (idea) => idea.status === 'confirmed' && !idea.notified
      );

      if (confirmedUnnotified.length === 0) return;

      for (const idea of confirmedUnnotified) {
        alert(
          `🎉 Your idea "${idea.title}" has been APPROVED.\n\nYour Idea Submission Certificate has been sent and is now available.`
        );

        await supabase
          .from('ideas')
          .update({ notified: true })
          .eq('id', idea.id);
      }

      // refresh AFTER marking notified
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await loadIdeas(user.id);
      }
    };

    if (ideas.length > 0) {
      run();
    }
  }, [ideas, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white px-6 pt-24 pb-10">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-emerald-300">
              My Ideas
            </h1>
            <p className="text-white/70 mt-1">
              Only you and confirmed parties can view these ideas.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/submit" className="bg-emerald-400 px-4 py-2 rounded-full text-black">
              Submit another idea
            </Link>

            <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded-full">
              Logout
            </button>
          </div>
        </div>

        {/* COUNTS */}
        <div className="flex gap-3">
          <span>Pending {counts.pending}</span>
          <span>Confirmed {counts.confirmed}</span>
          <span>Blocked {counts.blocked}</span>
        </div>

        {/* IDEAS */}
        <div className="grid md:grid-cols-2 gap-4">
          {ideas.map((idea) => (
            <div key={idea.id} className="p-4 bg-black/40 rounded-xl">

              <h2>{idea.title}</h2>

              {/* ✅ FIXED STATUS UI */}
              {idea.status === 'pending' && (
                <p className="text-emerald-300">pending · 🔒 protected</p>
              )}

              {idea.status === 'confirmed' && (
                <p className="text-green-300">
                  confirmed · ✅ certificate available
                </p>
              )}

              {idea.status === 'blocked' && (
                <p className="text-red-300">blocked · ❌</p>
              )}

            </div>
          ))}
        </div>

      </div>
    </main>
  );
}