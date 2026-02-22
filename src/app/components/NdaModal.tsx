'use client';

import { useState, type FormEvent } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Props = {
  open: boolean;
  onClose: () => void;
  ideaId: string;
  ideaTitle: string;
};

export default function NdaModal({ open, onClose, ideaId, ideaTitle }: Props) {
  const supabase = createClientComponentClient();

  const [email, setEmail] = useState('');
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  async function requestNDA(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErr('Please enter your work email.');
      return;
    }
    if (!agree) {
      setErr('Please agree to the NDA request terms.');
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Must be logged in
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();

      if (authErr) {
        console.error('Auth error in NdaModal:', authErr);
        setErr(
          authErr.message ||
            'Could not verify your session. Please log in again.'
        );
        return;
      }

      if (!user) {
        setErr('Please log in as an investor before requesting an NDA.');
        return;
      }

      // 2️⃣ Insert NDA request – matches the simple RLS policy (auth.uid() IS NOT NULL)
      const { error } = await supabase.from('nda_requests').insert({
        idea_id: ideaId,
        user_id: user.id,
        email: trimmedEmail,
        status: 'pending',
      });

      if (error) {
        console.error('NDA insert error:', error);

        if (error.message?.toLowerCase().includes('row-level security')) {
          setErr(
            'Security rules block this NDA request. Please make sure you are logged in with your investor account and try again.'
          );
        } else {
          setErr(error.message || 'Could not submit NDA request.');
        }
        return;
      }

      // 3️⃣ Success
      setMsg('✅ Request received. NDA instructions will be sent by email.');
      setEmail('');
      setAgree(false);
    } catch (e: any) {
      console.error('Unexpected error in NdaModal:', e);
      const message =
        e?.message === 'Failed to fetch'
          ? 'Could not reach the server. Please check your internet connection and try again.'
          : e?.message || 'Could not submit NDA request.';
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    // optional: clear state when closing
    setErr(null);
    setMsg(null);
    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0f1629] p-5 text-white shadow-xl">
        <h3 className="text-lg font-semibold">Request NDA — {ideaTitle}</h3>
        <p className="mt-1 text-sm text-white/70">
          This idea is protected. Submit your work email to receive an NDA and
          view the full brief. You can first{' '}
          <a
            href="/legal/nda"
            target="_blank"
            className="text-emerald-300 underline"
          >
            read the NDA summary
          </a>
          .
        </p>

        <form onSubmit={requestNDA} className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-white/80">Work Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 outline-none"
            />
          </div>

          <label className="flex items-start gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span>
              I agree that this request is for evaluation only; disclosure is
              under mutual NDA and does not transfer IP ownership.
            </span>
          </label>

          {err && <p className="text-xs text-red-300">{err}</p>}
          {msg && <p className="text-xs text-emerald-300">{msg}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Request NDA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}