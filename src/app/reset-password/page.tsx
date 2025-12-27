'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ResetPasswordPage() {
  const supabase = createClientComponentClient();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // ✅ Just check if a recovery session exists – no exchangeCodeForSession
  useEffect(() => {
    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error(error);
        setErr('Could not verify reset session. Please request a new email.');
        return;
      }

      if (!data.session) {
        setErr(
          'Password reset link is invalid or expired. Please request a new reset email from the Forgot Password page.'
        );
        return;
      }

      setReady(true);
    }

    checkSession();
  }, [supabase]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!password || password !== confirm) {
      setErr('Passwords do not match.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error(error);
      setErr(error.message || 'Password update failed.');
      return;
    }

    setMsg('Password updated successfully. You can now log in with your new password.');
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold mb-3 text-emerald-400">
          Enter a new password
        </h1>

        {!ready && !err && (
          <p className="text-amber-300 text-sm">
            Validating reset link… please wait.
          </p>
        )}

        {err && (
          <p className="text-rose-300 text-sm mb-3">
            {err}
          </p>
        )}

        {ready && !err && (
          <form onSubmit={handleUpdate} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 rounded bg-black/60 border border-white/20 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Confirm</label>
              <input
                type="password"
                className="w-full px-3 py-2 rounded bg-black/60 border border-white/20 outline-none"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            {msg && <p className="text-emerald-300 text-sm">{msg}</p>}

            <button
              type="submit"
              className="w-full bg-emerald-400 text-black py-2 rounded font-semibold mt-1"
            >
              Update password
            </button>
          </form>
        )}
      </div>
    </main>
  );
}