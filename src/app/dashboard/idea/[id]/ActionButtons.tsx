'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../../../../supabase';

type Status = 'pending' | 'viewed' | 'confirmed' | 'blocked';

export default function ActionButtons({
  ideaId,
  currentStatus,
}: {
  ideaId: string;
  currentStatus: Status;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | 'confirm' | 'block' | 'delete'>(null);
  const disabled = !!busy;

  async function confirmIdea() {
    try {
      setBusy('confirm');

      // 1) Update idea status in Supabase
      const { error } = await supabase
        .from('ideas')
        .update({
          status: 'confirmed',
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'admin',
        })
        .eq('id', ideaId);

      if (error) throw error;

      // 2) Fire-and-forget email (do NOT block redirect)
      try {
        fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: 'anewdawn1st@gmail.com', // admin inbox
            subject: 'A new idea has been marked Confirmed',
            html: `
              <h2 style="color:#10b981;">Idea Successfully Confirmed</h2>
              <p>Dear Admin,</p>
              <p>The following idea has been marked as <strong style="color:#10b981;">CONFIRMED</strong>.</p>
              <p><strong>Idea ID:</strong> ${ideaId}</p>
              <p>You may now proceed with further review or follow-up actions.</p>
              <br/>
              <p style="font-size:12px; color:#6b7280;">
                Bank of Unique Ideas — Automated Notification System
              </p>
            `,
          }),
        }).catch((emailErr) => {
          console.error('Email send error:', emailErr);
        });
      } catch (emailOuterErr) {
        console.error('Email outer error:', emailOuterErr);
      }

      // 3) Redirect back to dashboard immediately
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('Failed to confirm idea.');
    } finally {
      setBusy(null);
    }
  }

  function blockIdea() {
    if (disabled) return;
    router.push(`/dashboard/idea/${ideaId}/block`);
  }

  function deleteIdea() {
    if (disabled) return;
    router.push(`/dashboard/idea/${ideaId}/delete`);
  }

  return (
    <div className="flex flex-col gap-3 md:flex-col">
      <button
        onClick={confirmIdea}
        disabled={
          disabled ||
          currentStatus === 'confirmed' ||
          currentStatus === 'blocked'
        }
        className={`px-5 py-2 rounded-full font-semibold text-sm ${
          currentStatus === 'confirmed'
            ? 'bg-emerald-700/60 text-emerald-100 cursor-not-allowed'
            : 'bg-cyan-400 text-black hover:bg-cyan-300 disabled:opacity-60'
        }`}
      >
        {busy === 'confirm'
          ? 'Confirming…'
          : currentStatus === 'confirmed'
          ? 'Confirmed'
          : 'Confirm'}
      </button>

      <button
        onClick={blockIdea}
        disabled={disabled || currentStatus === 'confirmed'}
        className="px-5 py-2 rounded-full font-semibold text-sm bg-orange-500 text-white hover:bg-orange-400 disabled:opacity-60"
      >
        {busy === 'block' ? 'Opening…' : 'Block'}
      </button>

      <button
        onClick={deleteIdea}
        disabled={disabled}
        className="px-5 py-2 rounded-full font-semibold text-sm bg-rose-500 text-white hover:bg-rose-400 disabled:opacity-60"
      >
        {busy === 'delete' ? 'Opening…' : 'Delete'}
      </button>
    </div>
  );
}
