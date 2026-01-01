'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const ADMIN_EMAIL =
  (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'patmartinsbest@gmail.com').toLowerCase();
  
export default function AdminLoginPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || resetting) return;

    setError(null);
    setMsg(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError('Invalid email or password.');
        return;
      }

      const loggedEmail = data.user?.email ?? null;

      // admin-only gate
      if (!loggedEmail || loggedEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        await supabase.auth.signOut();
        setError('You are not authorized to access the admin dashboard.');
        return;
      }

      // ✅ success
      router.replace('/dashboard');
    } catch (err: any) {
      console.error('Unexpected login error:', err);
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (loading || resetting) return;

    setError(null);
    setMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your admin email first.');
      return;
    }

    setResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setMsg('Password reset email sent. Check your inbox.');
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err?.message || 'Could not send reset email.');
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
            disabled={loading || resetting}
            className="mt-2 w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Log in as Admin'}
          </button>

          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={loading || resetting}
            className="w-full text-xs text-emerald-300 hover:underline disabled:opacity-60"
          >
            {resetting ? 'Sending reset email…' : 'Forgot password?'}
          </button>
        </form>
      </div>
    </main>
  );
}