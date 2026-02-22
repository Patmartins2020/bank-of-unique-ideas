'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export type NDAAdminAction = 'send_nda_link' | 'reject_request' | 'approve_signed';

const normalizeEmail = (v: string) => (v || '').trim().toLowerCase();

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClientComponentClient(), []);

  // ✅ safer: computed once, consistent
  const ADMIN_EMAIL = useMemo(
    () => normalizeEmail(process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'patmartinsbest@gmail.com'),
    []
  );

  // ✅ start empty; prefill is okay but optional
  const [email, setEmail] = useState<string>(ADMIN_EMAIL);
  const [password, setPassword] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const busy = loading || resetting;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    setError(null);
    setMsg(null);
    setLoading(true);

    try {
      const cleanEmail = normalizeEmail(email);

      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInErr) {
        setError('Invalid email or password.');
        return;
      }

      const loggedEmail = normalizeEmail(data.user?.email || '');
      // ✅ admin gate
      if (!loggedEmail || loggedEmail !== ADMIN_EMAIL) {
        await supabase.auth.signOut();
        setError('You are not authorized to access the admin dashboard.');
        return;
      }

      // ✅ success
      router.replace('/dashboard');
    } catch (err) {
      console.error('Unexpected login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (busy) return;

    setError(null);
    setMsg(null);

    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) {
      setError('Please enter your admin email first.');
      return;
    }

    setResetting(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });

      if (resetErr) {
        setError(resetErr.message);
        return;
      }

      setMsg('Password reset email sent. Check your inbox.');
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err instanceof Error ? err.message : 'Could not send reset email.');
    } finally {
      setResetting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white px-6 pt-24 pb-10">
      <div className="max-w-md mx-auto rounded-2xl border border-white/10 bg-black/40 p-6 md:p-8 shadow-lg shadow-black/40">
        <h1 className="text-2xl font-bold mb-4 text-emerald-300">Admin Login</h1>

        <p className="text-sm text-white/70 mb-6">
          Enter your admin email and password to access the Bank of Unique Ideas dashboard.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-sm text-rose-300">{error}</p>}
          {msg && <p className="text-sm text-emerald-300">{msg}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Log in as Admin'}
          </button>

          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={busy}
            className="w-full text-xs text-emerald-300 hover:underline disabled:opacity-60"
          >
            {resetting ? 'Sending reset email…' : 'Forgot password?'}
          </button>
        </form>
      </div>
    </main>
  );
}