'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';

export default function BlockIdeaPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!reason.trim()) {
      alert('Please provide a reason for blocking.');
      return;
    }
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('ideas')
        .update({
          status: 'blocked',
          reason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'admin',
        })
        .eq('id', id);

      if (error) throw error;

      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('Failed to block idea.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-neutral-900 text-white px-6 py-12">
      <div className="max-w-xl mx-auto bg-white/10 p-6 rounded-xl border border-white/20">
        <h1 className="text-2xl mb-4 font-semibold text-orange-400">
          Block Idea — Reason Required
        </h1>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain the reason for blocking..."
          className="w-full min-h-[120px] p-3 rounded bg-black/40 border border-white/20 text-white outline-none"
        />

        <div className="mt-6 flex gap-4">
          <button
            onClick={submit}
            disabled={submitting}
            className="px-5 py-2 rounded bg-orange-500 text-white hover:bg-orange-400 disabled:opacity-60"
          >
            {submitting ? 'Processing…' : 'Confirm Block'}
          </button>

          <button
            onClick={() => router.push(`/dashboard/idea/${id}`)}
            className="px-5 py-2 rounded bg-gray-500 text-white hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </main>
  );
}