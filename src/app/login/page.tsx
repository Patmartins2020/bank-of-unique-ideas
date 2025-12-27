'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !pwd) {
      setErr('Please enter email and password.');
      return;
    }

    try {
      setLoading(true);

      // 🔐 Sign in with Supabase Auth
      const {
        data,
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: pwd,
      });

      if (authError) {
        console.error('LOGIN ERROR:', authError);
        setErr(authError.message || 'Invalid login credentials');
        return;
      }

      if (!data?.user) {
        setErr('Login failed. Please try again.');
        return;
      }

      // ✅ Logged in – send inventors to /my-ideas for now
      router.replace('/my-ideas');
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl">
        <h1 className="mb-1 text-2xl font-extrabold text-emerald-400">
          Access your vault
        </h1>
        <p className="mb-4 text-sm text-white/70">
          Sign in with the email and password you used to create your account.
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-white/80">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2 text-sm outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/80">Password</label>
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2 text-sm outline-none"
              placeholder="••••••••"
            />
          </div>

          {err && <p className="text-sm text-rose-300">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-3 text-xs text-white/60">
          Forgot your password?{' '}
          <a href="/forgot-password" className="text-emerald-300 underline">
            Reset it
          </a>
        </p>
      </div>
    </main>
  );
}