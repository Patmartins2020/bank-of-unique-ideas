'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function LogoutPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'working' | 'done' | 'error'>('working');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
        setStatus('error');
        return;
      }
      setStatus('done');
      // Redirect home after a short pause
      setTimeout(() => router.push('/'), 2500);
    })();
  }, [router]);

  return (
    <main className="min-h-screen bg-[#0b1120] text-white flex items-center justify-center">
      <div className="max-w-sm w-full rounded-xl border border-white/10 bg-white/5 p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Logging you out…</h1>
        {status === 'working' && (
          <p className="text-white/70">Please wait a moment.</p>
        )}
        {status === 'done' && (
          <p className="text-emerald-300">Signed out. Redirecting…</p>
        )}
        {status === 'error' && (
          <p className="text-rose-300">Couldn’t sign out: {error}</p>
        )}
      </div>
    </main>
  );
}
