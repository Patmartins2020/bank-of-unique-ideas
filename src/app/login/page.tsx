'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
      if (error) throw error;

      // Get role and redirect accordingly
      const { data: user } = await supabase.auth.getUser();
      const uid = user.user?.id;
      if (uid) {
        const { data: p } = await supabase.from('profiles').select('role').eq('id', uid).single();
        const role = p?.role as 'inventor' | 'investor' | undefined;
        if (role === 'inventor') router.push('/submit');
        else router.push('/');
      } else {
        router.push('/');
      }
    } catch (e: any) {
      setErr(e?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b1120] text-white">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <Link href="/" className="text-emerald-300 hover:text-emerald-200">← Back</Link>
          <h1 className="text-lg font-semibold">Log In</h1>
          <div />
        </div>
      </header>

      <section className="mx-auto max-w-md px-4 py-8">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-2xl font-extrabold text-emerald-400">Welcome Back</h2>

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
              {loading ? 'Logging in…' : 'Log In'}
            </button>

            <div className="mt-2 flex justify-between text-xs text-white/70">
              <Link href="/signup" className="text-emerald-300 underline">Create account</Link>
              <Link href="/forgot-password" className="text-emerald-300 underline">Forgot password?</Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
