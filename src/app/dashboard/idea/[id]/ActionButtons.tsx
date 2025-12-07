'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

type Status = 'pending' | 'confirmed' | 'blocked' | 'deleted';

export function ActionButtons({
  ideaId,
  currentStatus,
}: {
  ideaId: string;
  currentStatus: Status;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | 'confirm' | 'delete' | 'block'>(null);
  const disabled = !!busy;

  /** -----------------------
   * CONFIRM (approved)
   * ------------------------*/
  async function confirm() {
    try {
      setBusy('confirm');
      const { error } = await supabase
        .from('ideas')
        .update({
          status: 'confirmed', // will appear blurred on homepage
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'admin',
        })
        .eq('id', ideaId);

      if (error) throw error;
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('Failed to confirm.');
    } finally {
      setBusy(null);
    }
  }

  /** -----------------------
   * DELETE (redirect with reason)
   * ------------------------*/
  function deleteWithReason() {
    router.push(`/dashboard/idea/${ideaId}/delete`);
  }

  /** -----------------------
   * BLOCK (redirect with reason)
   * ------------------------*/
  function blockWithReason() {
    router.push(`/dashboard/idea/${ideaId}/block`);
  }

  return (
    <div className="flex gap-6 mt-8">
      {/* CONFIRM BUTTON */}
      <button
        onClick={confirm}
        disabled={disabled || currentStatus === 'confirmed'}
        className={`px-5 py-2 rounded-full font-semibold ${
          currentStatus === 'confirmed'
            ? 'bg-emerald-700/40 text-emerald-200 cursor-not-allowed'
            : 'bg-emerald-400 text-black hover:bg-emerald-300'
        }`}
      >
        {busy === 'confirm'
          ? 'Confirming…'
          : currentStatus === 'confirmed'
          ? 'Confirmed'
          : 'Confirm'}
      </button>

      {/* BLOCK BUTTON */}
      <button
        onClick={blockWithReason}
        disabled={disabled}
        className="px-5 py-2 rounded-full font-semibold bg-orange-500 text-white hover:bg-orange-400 disabled:opacity-60"
      >
        {busy === 'block' ? 'Blocking…' : 'Block'}
      </button>

      {/* DELETE BUTTON */}
      <button
        onClick={deleteWithReason}
        disabled={disabled}
        className="px-5 py-2 rounded-full font-semibold bg-rose-500 text-white hover:bg-rose-400 disabled:opacity-60"
      >
        {busy === 'delete' ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  );
}
