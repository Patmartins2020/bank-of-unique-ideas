'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type IdeaRow = {
  id: string;
  user_id: string;
  title: string | null;
  status: 'pending' | 'confirmed' | 'blocked' | null;
  protected: boolean | null;
  created_at: string | null;
  full_name?: string | null;
  category?: string | null;
  verification_code?: string | null;
  avatar_url?: string | null;
};

export default function MyIdeasPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);

  /* ================= LOAD ================= */

  async function loadIdeas(userId: string) {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const enriched = await Promise.all(
      (data || []).map(async (idea) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', idea.user_id)
          .maybeSingle();

        return {
          ...idea,
          avatar_url: profile?.avatar_url || null,
        };
      })
    );

    setIdeas(enriched as IdeaRow[]);
  }

  /* ================= REALTIME ================= */

  useEffect(() => {
    let channel: any;

    async function init() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace('/login');
          return;
        }

        await loadIdeas(user.id);

        // realtime updates
        channel = supabase
          .channel('ideas-realtime')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'ideas',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              setIdeas((prev) =>
                prev.map((idea) =>
                  idea.id === payload.new.id
                    ? { ...idea, ...payload.new }
                    : idea
                )
              );
            }
          )
          .subscribe();

      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [router, supabase]);

  /* ================= COUNTS ================= */

  const counts = useMemo(
    () => ({
      pending: ideas.filter((i) => i.status === 'pending').length,
      confirmed: ideas.filter((i) => i.status === 'confirmed').length,
      blocked: ideas.filter((i) => i.status === 'blocked').length,
    }),
    [ideas]
  );

  /* ================= DOWNLOAD (FIXED) ================= */

  function handleDownloadCertificate(idea: IdeaRow) {
    if (!idea.verification_code) {
      alert('Certificate not available');
      return;
    }

    // 👉 OPEN SAME CERTIFICATE AS VERIFY PAGE
    window.open(`/verify?code=${idea.verification_code}`, '_blank');
  }

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-6 pt-24 pb-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-emerald-300">
              My Ideas Vault
            </h1>
            <p className="text-white/60">
              Track your submissions and certificates
            </p>
          </div>

          <Link
            href="/submit"
            className="bg-white text-black px-5 py-2 rounded-lg font-semibold"
          >
            + Submit Idea
          </Link>
        </div>

        {/* COUNTS */}
        <div className="flex gap-3 text-sm">
          <span className="bg-yellow-500/10 px-3 py-1 rounded-full text-yellow-300">
            Pending {counts.pending}
          </span>
          <span className="bg-emerald-500/10 px-3 py-1 rounded-full text-emerald-300">
            Confirmed {counts.confirmed}
          </span>
          <span className="bg-red-500/10 px-3 py-1 rounded-full text-red-300">
            Blocked {counts.blocked}
          </span>
        </div>

        {loading && <p>Loading...</p>}
        {err && <p className="text-red-400">{err}</p>}

        {/* CARDS */}
        <div className="grid md:grid-cols-2 gap-5">

          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="bg-white/5 border border-white/10 rounded-xl p-5"
            >
              <h2 className="font-bold text-lg">
                {idea.title || 'Untitled'}
              </h2>

              <p className="text-xs text-white/50">
                {idea.category || 'General'}
              </p>

              {/* STATUS */}
              <div className="mt-4">

                {idea.status === 'pending' && (
                  <div className="text-yellow-300 text-sm">
                    ⏳ Under Admin Review
                    <p className="text-white/40 text-xs mt-1">
                      Certificate locked until approval
                    </p>
                  </div>
                )}

                {idea.status === 'blocked' && (
                  <div className="text-red-400 text-sm">
                    ❌ Blocked
                  </div>
                )}

                {idea.status === 'confirmed' && (
                  <div className="space-y-2">
                    <p className="text-emerald-300">
                      ✅ Approved
                    </p>

                    <div className="flex gap-3">

                    <div className="mt-3">
  <Link
    href={`/verify?code=${idea.verification_code}`}
    className="bg-emerald-400 text-black px-4 py-2 rounded-lg text-sm font-semibold inline-block"
  >
    View Certificate
  </Link>
</div>

                    </div>
                  </div>
                )}

              </div>
            </div>
          ))}

        </div>
      </div>
    </main>
  );
}