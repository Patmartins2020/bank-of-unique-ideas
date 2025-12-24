'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Role = 'inventor' | 'investor';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // helper: send user to the correct dashboard
  async function routeByRole(userId: string, fallbackRole?: string | null) {
    // Try to read role from profiles
    const { data: prof } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle<{ role: string | null }>();

    const role = (prof?.role ?? fallbackRole ?? 'inventor') as Role;

    if (role === 'investor') {
      router.replace('/investor'); // investor dashboard
    } else {
      router.replace('/my-ideas'); // inventor dashboard
    }
  }

  // If user is already logged in and visits /login, redirect them
  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user || cancelled) return;

      await routeByRole(user.id, (user.user_metadata as any)?.role);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!email.trim()) return setErr('Email is required.');
    if (!pwd) return setErr('Password is required.');

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pwd,
      });

      if (error) throw error;

      const user = data.user;
      if (!user) {
        setErr('Login failed. No user returned.');
        return;
      }

      await routeByRole(user.id, (user.user_metadata as any)?.role);
    } catch (e: any) {
      setErr(e?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <Link href="/" className="text-emerald-300 hover:text-emerald-200">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold">Log in</h1>
          <div />
        </div>
      </header>

      <section className="mx-auto max-w-md px-4 py-8">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-2xl font-extrabold text-emerald-400">Welcome back</h2>

          <form onSubmit={onSubmit} className="grid gap-3">
            <div>
              <label className="mb-1 block text-sm text-white/80">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 outline-none"
                placeholder="you@work.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-white/80">Password</label>
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 outline-none"
              />
            </div>

            {err && <p className="text-sm text-rose-300">{err}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-md bg-emerald-400 px-4 py-2 font-semibold text-black hover:bg-emerald-300 disabled:opacity-60"
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>

            <p className="mt-2 text-xs text-white/70">
              No account yet?{' '}
              <Link href="/signup" className="text-emerald-300 underline">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}