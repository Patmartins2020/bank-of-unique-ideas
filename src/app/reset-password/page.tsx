'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function ResetPasswordPage() {
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [checking, setChecking] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check that we actually have a valid recovery session
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (cancelled) return;

        if (error || !data.user) {
          console.error(error);
          setErr(
            'Password reset link is invalid or has expired. Please request a new reset email from the login page.'
          );
          setChecking(false);
          return;
        }

        setChecking(false);
      } catch (e: any) {
        if (cancelled) return;
        console.error(e);
        setErr(
          'Password reset link is invalid or has expired. Please request a new reset email from the login page.'
        );
        setChecking(false);
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (pwd.length < 6) {
      setErr('Password must be at least 6 characters.');
      return;
    }
    if (pwd !== pwd2) {
      setErr('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({ password: pwd });

      if (error) {
        console.error(error);
        setErr(
          error.message ||
            'Could not update password. Please request a new reset email from the login page.'
        );
        return;
      }

      setMsg('Password updated. You can now log in with your new password.');
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Could not update password.');
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
          <h1 className="text-lg font-semibold">Set New Password</h1>
          <div />
        </div>
      </header>

      <section className="mx-auto max-w-md px-4 py-8">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-2xl font-extrabold text-emerald-400">
            Enter a new password
          </h2>

          {checking ? (
            <p className="text-sm text-white/70">
              Verifying your reset link…
            </p>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-white/80">
                    Password
                  </label>
                  <input
                    type="password"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-white/80">
                    Confirm
                  </label>
                  <input
                    type="password"
                    value={pwd2}
                    onChange={(e) => setPwd2(e.target.value)}
                    className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 outline-none"
                  />
                </div>
              </div>

              {err && <p className="text-sm text-rose-300">{err}</p>}
              {msg && <p className="text-sm text-emerald-300">{msg}</p>}

              <button
                type="submit"
                disabled={loading || !!err}
                className="mt-1 rounded-md bg-emerald-400 px-4 py-2 font-semibold text-black hover:bg-emerald-300 disabled:opacity-60"
              >
                {loading ? 'Updating…' : 'Update password'}
              </button>

              <p className="mt-3 text-xs text-white/70">
                Back to{' '}
                <Link href="/login" className="text-emerald-300 underline">
                  Login
                </Link>
              </p>
            </form>
          )}

          {!checking && err && (
            <p className="mt-3 text-xs text-white/70">
              Go to{' '}
              <Link href="/forgot-password" className="text-emerald-300 underline">
                Forgot password
              </Link>{' '}
              and request a new link.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}