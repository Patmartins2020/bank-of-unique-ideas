'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

type Status = 'pending' | 'viewed' | 'approved' | 'rejected';

export function ActionButtons({
  ideaId,
  currentStatus,
}: {
  ideaId: string;
  currentStatus: Status;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | 'approve' | 'delete'>(null);
  const disabled = !!busy;

  async function approve() {
    try {
      setBusy('approve');
      const { error } = await supabase
        .from('ideas')
        .update({
          review_status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'admin',
        })
        .eq('id', ideaId);

      if (error) throw error;
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('Failed to approve.');
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm('Delete this idea? This cannot be undone.')) return;
    try {
      setBusy('delete');
      const { error } = await supabase.from('ideas').delete().eq('id', ideaId);
      if (error) throw error;
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('Failed to delete.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex gap-6 mt-6">
      <button
        onClick={approve}
        disabled={disabled || currentStatus === 'approved'}
        className={`px-5 py-2 rounded-full font-semibold ${
          currentStatus === 'approved'
            ? 'bg-emerald-700/40 text-emerald-200 cursor-not-allowed'
            : 'bg-emerald-400 text-black hover:bg-emerald-300'
        }`}
      >
        {busy === 'approve'
          ? 'Approving…'
          : currentStatus === 'approved'
          ? 'Approved'
          : 'Approve'}
      </button>

      <button
        onClick={remove}
        disabled={disabled}
        className="px-5 py-2 rounded-full font-semibold bg-rose-500 text-white hover:bg-rose-400 disabled:opacity-60"
      >
        {busy === 'delete' ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  );
}
