'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../../../../../supabase';

export default function DeleteIdeaPage() {
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

      // 1️⃣ Delete related assets first (fixes foreign key problems)
      const { error: assetsErr } = await supabase
        .from('idea_assets')
        .delete()
        .eq('idea_id', id);

      if (assetsErr) {
        console.error('Delete assets error:', assetsErr);
        alert('Failed to delete related files: ' + assetsErr.message);
        setBusy(false);
        return;
      }

      // 2️⃣ Delete the idea itself
      const { error: ideaErr } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id);

      if (ideaErr) {
        console.error('Delete idea error:', ideaErr);
        alert('Failed to delete idea: ' + ideaErr.message);
        setBusy(false);
        return;
      }

      // (Later we can store "reason" in a separate audit table if you want)

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete idea: ' + (err?.message || 'Unknown error'));
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
        <h1 className="text-2xl font-bold text-rose-400 mb-4">Delete Idea</h1>
        <p className="text-sm text-white/80 mb-4">
          You’re about to permanently delete this idea from the Bank of Unique
          Ideas. Please add a short note explaining why.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Reason / Comment
            </label>
            <textarea
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400 min-h-[120px] resize-vertical"
              placeholder="e.g. Harmful or dangerous, duplicated idea, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 rounded-full font-semibold text-sm bg-rose-500 text-white hover:bg-rose-400 disabled:opacity-60"
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
