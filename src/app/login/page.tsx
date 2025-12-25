'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type ProfileRow = {
  id: string;
  role: string | null;
  full_name: string | null;
};

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // 🔹 On mount, see if user is already logged in and redirect by role
  useEffect(() => {
    let cancelled = false;

    async function check() {
      setCheckingSession(true);
      try {
        let userId: string | null = null;

        try {
          const { data, error } = await supabase.auth.getUser();

          if (!error) {
            userId = data.user?.id ?? null;
          } else if (error.name !== 'AuthSessionMissingError') {
            console.warn('login getUser error:', error);
          }
        } catch (e: any) {
          if (e?.name !== 'AuthSessionMissingError') {
            console.warn('login getUser threw:', e);
          }
        }

        if (!userId || cancelled) return;

        // We have a user; look up profile + role
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('id, role, full_name')
          .eq('id', userId)
          .maybeSingle<ProfileRow>();

        if (profErr) {
          console.warn('login profile error:', profErr);
        }

        const role = (prof?.role ?? 'inventor') as string;

        if (role === 'inventor') {
          router.replace('/my-ideas');
        } else if (role === 'investor') {
          router.replace('/investor/ideas');
        } else if (role === 'admin') {
          router.replace('/dashboard'); // adjust if you have an admin route
        } else {
          router.replace('/home');
        }
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!email.trim() || !pwd) {
      setErr('Email and password are required.');
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user, session },
        error,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pwd,
      });

      if (error) throw error;
      if (!user) {
        setErr('Login failed. No user returned.');
        return;
      }

      // Fetch role from profiles
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('id', user.id)
        .maybeSingle<ProfileRow>();

      if (profErr) {
        console.warn('profile fetch after login failed:', profErr);
      }

      const role = (prof?.role ??
        (user.user_metadata as any)?.role ??
        'inventor') as string;

      setMsg('Login successful. Redirecting…');

      if (role === 'inventor') {
        router.replace('/my-ideas');
      } else if (role === 'investor') {
        router.replace('/investor/ideas');
      } else if (role === 'admin') {
        router.replace('/dashboard');
      } else {
        router.replace('/home');
      }
    } catch (e: any) {
      console.error('login error:', e);
      setErr(e?.message || 'Could not log in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b1120] text-white">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <Link href="/" className="text-emerald-300 hover:text-emerald-200">
            ← Home
          </Link>
          <h1 className="text-lg font-semibold">Log in</h1>
          <div />
        </div>
      </header>

      <section className="mx-auto max-w-md px-4 py-8">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-2xl font-extrabold text-emerald-400">
            Access your vault
          </h2>

          {checkingSession && (
            <p className="mb-3 text-xs text-white/60">
              Checking your session…
            </p>
          )}

          <form onSubmit={onSubmit} className="grid gap-3">
            <div>
              <label className="mb-1 block text-sm text-white/80">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 outline-none"
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
            {msg && <p className="text-sm text-emerald-300">{msg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-md bg-emerald-400 px-4 py-2 font-semibold text-black hover:bg-emerald-300 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="mt-2 text-xs text-white/70">
              Forgot password?{' '}
              <Link href="/reset-password" className="text-emerald-300 underline">
                Reset it
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}