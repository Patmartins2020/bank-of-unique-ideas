'use client';

import { useState } from 'react';
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

    const trimmedEmail = email.trim();
    const trimmedPwd = pwd.trim();

    if (!trimmedEmail || !trimmedPwd) {
      setErr('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);

      // 1) Sign in with Supabase Auth
      const {
        data: { user, session },
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPwd,
      });

      if (authError) {
        console.error(authError);
        // show nice message for wrong password
        if (authError.message.toLowerCase().includes('invalid login credentials')) {
          setErr('Invalid login credentials.');
        } else {
          setErr(authError.message || 'Login failed.');
        }
        return;
      }

      if (!user || !session) {
        setErr('Login failed. No active session.');
        return;
      }

      // 2) Determine role: prefer profiles.role, fall back to user metadata
      let role: string | undefined =
        (user.user_metadata as any)?.role ?? undefined;

      try {
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle<{ role: string }>();

        if (!profErr && prof?.role) {
          role = prof.role;
        }
      } catch (e) {
        console.warn('Could not load profile role (will fall back to metadata).');
      }

      if (!role) {
        // default if nothing is set
        role = 'inventor';
      }

      // 3) Redirect based on role
      if (role === 'admin') {
        router.replace('/admin'); // adjust if your admin route is different
      } else if (role === 'investor') {
        // ✅ investors go to blurred ideas + NDA flow
        router.replace('/investor/ideas');
      } else if (role === 'inventor') {
        // ✅ inventors go to their own ideas vault
        router.replace('/my-ideas');
      } else {
        // fallback
        router.replace('/');
      }
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/60 px-6 py-7 shadow-xl shadow-black/50">
        <h1 className="mb-1 text-2xl font-extrabold text-emerald-400">
          Access your vault
        </h1>
        <p className="mb-5 text-sm text-white/70">
          Sign in with the email and password you used to create your account.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/80 mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-md border border-white/20 bg-black/70 px-3 py-2 text-sm outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-md border border-white/20 bg-black/70 px-3 py-2 text-sm outline-none"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {err && <p className="text-sm text-rose-300">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-emerald-400 py-2 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-xs text-white/70">
          Forgot password?{' '}
          <a href="/forgot-password" className="text-emerald-300 underline">
            Reset it
          </a>
        </p>
      </div>
    </main>
  );
}