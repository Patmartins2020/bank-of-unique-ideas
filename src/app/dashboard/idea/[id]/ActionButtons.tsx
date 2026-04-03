'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

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

      // 1) get idea owner info first
      const { data: idea, error: fetchError } = await supabase
        .from('ideas')
        .select('id, title, user_id')
        .eq('id', ideaId)
        .single();

      if (fetchError || !idea) throw fetchError;

      // 2) update idea
      const { error } = await supabase
        .from('ideas')
        .update({
          status: 'confirmed',
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'admin',
        })
        .eq('id', ideaId);

      if (error) throw error;

      // 3) get inventor profile email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', idea.user_id)
        .single();

      // 4) send inventor email
      if (profile?.email) {
        fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: profile.email,
            subject: '🎉 Your BOUI idea has been confirmed',
            html: `
              <h2 style="color:#10b981;">Idea Successfully Confirmed</h2>
              <p>Dear ${profile.full_name || 'Inventor'},</p>
              <p>Your submitted idea <strong>${idea.title}</strong> has now been officially <strong style="color:#10b981;">CONFIRMED</strong>.</p>
              <p>Your deposit certificate is now ready for download inside your <strong>My Ideas Vault</strong>.</p>
              <p>
                <a href="https://bankofuniqueideas.com/my-ideas"
                   style="display:inline-block;padding:12px 18px;background:#10b981;color:#000;text-decoration:none;border-radius:999px;font-weight:bold;">
                  Open My Ideas Vault
                </a>
              </p>
              <br/>
              <p style="font-size:12px; color:#6b7280;">
                Bank of Unique Ideas — Automated Confirmation System
              </p>
            `,
          }),
        }).catch(console.error);
      }

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
        Block
      </button>

      <button
        onClick={deleteIdea}
        disabled={disabled}
        className="px-5 py-2 rounded-full font-semibold text-sm bg-rose-500 text-white hover:bg-rose-400 disabled:opacity-60"
      >
        Delete
      </button>
    </div>
  );
}