'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ForgotPasswordPage() {
  const supabase = createClientComponentClient();   // ✅ use the same client as other pages
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setErr('Please enter your email.');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error(error);
        setErr(error.message || 'Could not send reset email.');
        return;
      }

      setMsg(
        'If this email exists, a reset link has been sent. Please check your inbox.'
      );
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Could not send reset email.');
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
          <h1 className="text-lg font-semibold">Forgot Password</h1>
          <div />
        </div>
      </header>

      <section className="mx-auto max-w-md px-4 py-8">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-2xl font-extrabold text-emerald-400">
            Reset your password
          </h2>

          <form onSubmit={onSubmit} className="grid gap-3">
            <div>
              <label className="mb-1 block text-sm text-white/80">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 outline-none"
                placeholder="you@example.com"
              />
            </div>

            {err && <p className="text-sm text-rose-300">{err}</p>}
            {msg && <p className="text-sm text-emerald-300">{msg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-md bg-emerald-400 px-4 py-2 font-semibold text-black hover:bg-emerald-300 disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          <p className="mt-4 text-xs text-white/70">
            Remembered your password?{' '}
            <Link href="/login" className="text-emerald-300 underline">
              Back to login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}