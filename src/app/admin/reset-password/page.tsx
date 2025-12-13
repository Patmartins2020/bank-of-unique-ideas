'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      router.push('/admin-login');
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
      <form
        onSubmit={handleReset}
        className="w-full max-w-sm rounded-xl border border-white/10 bg-black/40 p-6"
      >
        <h1 className="text-xl font-bold mb-4 text-emerald-300">
          Reset Admin Password
        </h1>

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 rounded-md border border-white/20 bg-black/50 px-3 py-2"
          required
        />

        {error && <p className="text-sm text-rose-300 mb-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-emerald-400 py-2 font-semibold text-black"
        >
          {loading ? 'Saving…' : 'Set new password'}
        </button>
      </form>
    </main>
  );
}