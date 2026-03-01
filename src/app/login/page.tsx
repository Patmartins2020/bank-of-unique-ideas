'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false); // ✅ show/hide toggle
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

      const {
        data: { user, session },
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPwd,
      });

      if (authError) {
        if (
          authError.message.toLowerCase().includes('invalid') ||
          authError.message.toLowerCase().includes('credentials')
        ) {
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

      // ---- determine role ----
      const adminEmail =
        process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'patmartinsbest@gmail.com';

      let role: string | undefined =
        (user.user_metadata as any)?.role ?? undefined;

      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle<{ role: string }>();

        if (prof?.role) role = prof.role;
      } catch {
        /* ignore */
      }

      if (user.email === adminEmail) role = 'admin';
      if (!role) role = 'inventor';

      // ---- redirect ----
      if (role === 'admin') router.replace('/dashboard');
      else if (role === 'investor') router.replace('/investor/ideas');
      else if (role === 'inventor') router.replace('/my-ideas');
      else router.replace('/');
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
          {/* Email */}
          <div>
            <label className="block text-sm text-white/80 mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-md border border-white/20 bg-black/70 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {/* Password with show/hide */}
          <div>
            <label className="block text-sm text-white/80 mb-1">Password</label>

            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                className="w-full rounded-md border border-white/20 bg-black/70 px-3 py-2 pr-14 text-sm outline-none focus:border-emerald-400"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoComplete="current-password"
              />

              {/* ✅ FIXED SHOW/HIDE BUTTON */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()} // prevents blur/click bug
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-white/70 hover:text-white hover:bg-white/10"
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? 'Hide' : 'Show'}
              </button>
            </div>
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
          <Link href="/forgot-password" className="text-emerald-300 underline">
            Reset it
          </Link>
        </p>
      </div>
    </main>
  );
}