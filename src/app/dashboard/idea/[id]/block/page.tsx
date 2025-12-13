'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';

export default function BlockIdeaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (!id) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white px-6 pt-24 pb-10">
        <div className="max-w-lg mx-auto">
          <p className="text-rose-300">Invalid idea id.</p>
        </div>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
      if (busy) return;

    try {
      setBusy(true);

      // ✅ Only update the status column – nothing else
      const { error } = await supabase
        .from('ideas')
        .update({
          status: 'blocked',
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'admin',
        })
        .eq('id', id);

      if (error) {
        console.error('Block error:', error);
        alert('Failed to block idea: ' + error.message);
        return;
      }

      // Later we can store reason into a column if you like
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to block idea.');
    } finally {
      setBusy(false);
    }
  }

  function handleCancel() {
    if (busy) return;
    router.back();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white px-6 pt-24 pb-10">
      <div className="max-w-lg mx-auto rounded-2xl border border-white/10 bg-black/40 p-6 md:p-8 shadow-lg shadow-black/40">
        <h1 className="text-2xl font-bold text-rose-400 mb-4">Block Idea</h1>
        <p className="text-sm text-white/80 mb-4">
          Please write a short note explaining why this idea is being blocked.
          (This is only for internal reference.)
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Reason / Comment
            </label>
            <textarea
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400 min-h-[120px] resize-vertical"
              placeholder="e.g. Non-conforming with platform guidelines…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 rounded-full font-semibold text-sm bg-orange-500 text-white hover:bg-orange-400 disabled:opacity-60"
            >
              {busy ? 'Processing…' : 'Processing'}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={handleCancel}
              className="px-5 py-2 rounded-full font-semibold text-sm bg-slate-600 text-white hover:bg-slate-500 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}