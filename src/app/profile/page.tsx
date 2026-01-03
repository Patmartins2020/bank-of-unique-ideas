'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../supabase';

type Role = 'inventor' | 'investor';
type Profile = {
  id: string;
  full_name: string | null;
  role: Role;
  area_of_interest: string | null;
  country: string | null;
};
type Idea = {
  id: string;
  title: string;
  review_status: 'pending' | 'viewed' | 'approved' | 'rejected' | null;
  created_at?: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) {
        setLoading(false);
        return;
      }

      const [{ data: p }, { data: myIdeas }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).single(),
        supabase
          .from('ideas')
          .select('id,title,review_status,created_at')
          .eq('user_id', uid)
          .order('created_at', { ascending: false }),
      ]);

      if (!cancelled) {
        setProfile(p as Profile);
        setIdeas((myIdeas || []) as Idea[]);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#0b1120] text-white">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-emerald-300 hover:text-emerald-200">
            ← Home
          </Link>
          <h1 className="text-lg font-semibold">My Profile</h1>
          <Link
            href="/dashboard"
            className="text-emerald-300 hover:text-emerald-200"
          >
            Dashboard →
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
            Loading…
          </div>
        ) : !profile ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-rose-300">
            You are not logged in.
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-bold text-emerald-300">
                {profile.full_name || 'Unnamed'}
              </h2>
              <p className="text-sm text-white/70">
                Role: <span className="font-semibold">{profile.role}</span>
              </p>
              {profile.role === 'inventor' && (
                <p className="text-sm text-white/70">
                  Country: {profile.country || '—'}
                </p>
              )}
              {profile.role === 'investor' && (
                <p className="text-sm text-white/70">
                  Area of Interest: {profile.area_of_interest || '—'}
                </p>
              )}
            </div>

            {profile.role === 'inventor' ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="mb-3 text-lg font-semibold text-emerald-300">
                  My Ideas
                </h3>
                {ideas.length === 0 ? (
                  <p className="text-white/70">
                    No ideas yet.{' '}
                    <Link href="/submit" className="text-emerald-300 underline">
                      Submit one →
                    </Link>
                  </p>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {ideas.map((i) => (
                      <li
                        key={i.id}
                        className="rounded-lg border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-emerald-200">
                            {i.title}
                          </p>
                          <span className="text-xs text-white/70">
                            {i.review_status ?? 'pending'}
                          </span>
                        </div>
                        {i.created_at && (
                          <p className="mt-1 text-xs text-white/50">
                            Submitted: {new Date(i.created_at).toLocaleString()}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="mb-3 text-lg font-semibold text-emerald-300">
                  Welcome, Investor
                </h3>
                <p className="text-white/70">
                  Your homepage will highlight approved ideas. You can also
                  filter by your area of interest:
                  <span className="ml-1 font-semibold text-white/90">
                    {profile.area_of_interest || 'Any'}
                  </span>
                  .
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
