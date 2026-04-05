'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SuccessClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [updating, setUpdating] = useState(true);
  const [message, setMessage] = useState(
    'Finalizing your paid deposit...'
  );

  const ideaId = useMemo(() => sp.get('idea') || '', [sp]);

  useEffect(() => {
    let mounted = true;

    async function finalizePayment() {
      try {
        if (!ideaId) {
          setMessage('No idea ID found in URL.');
          setUpdating(false);
          return;
        }

        // 1) get current idea first
        const { data: existingIdea, error: existingErr } =
          await supabase
            .from('ideas')
            .select(
              'id, title, verification_code, user_id, status, payment_status'
            )
            .eq('id', ideaId)
            .single();

        if (existingErr || !existingIdea) {
          throw existingErr || new Error('Idea not found.');
        }

        let idea = existingIdea;

        // 2) update ONLY if not already paid
        if (existingIdea.payment_status !== 'paid') {
          const { data: updatedIdea, error: updateError } =
            await supabase
              .from('ideas')
              .update({
                payment_status: 'paid',
                status: existingIdea.status || 'pending',
              })
              .eq('id', ideaId)
              .select(
                'id, title, verification_code, user_id, status, payment_status'
              )
              .single();

          if (updateError || !updatedIdea) {
            throw updateError || new Error('Update failed.');
          }

          idea = updatedIdea;
        }

        // 3) fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', idea.user_id)
          .single();

        // 4) send email ONLY first time payment becomes paid
        if (
          profile?.email &&
          existingIdea.payment_status !== 'paid'
        ) {
          try {
            await fetch('/api/send-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: profile.email,
                subject:
                  'BOUI Official Deposit Receipt | ' +
                  idea.verification_code,
                html: `
                  <h2 style="color:#10b981;">Payment Successful ✅</h2>
                  <p>Dear ${profile.full_name || 'Inventor'},</p>
                  <p>Your BOUI deposit payment has been successfully received.</p>
                  <p><strong>Idea:</strong> ${idea.title}</p>
                  <p><strong>Verification Code:</strong> ${idea.verification_code}</p>
                  <p>Your idea is now securely queued for BOUI admin verification.</p>
                  <p>Your certificate will unlock after confirmation.</p>
                `,
              }),
            });
          } catch (mailErr) {
            console.error('Email failed:', mailErr);
          }
        }

        setMessage(
          'Payment confirmed successfully. Your idea is safely in the BOUI admin review queue.'
        );

        setUpdating(false);

        setTimeout(() => {
          router.push('/my-ideas');
        }, 3500);
      } catch (err: any) {
        console.error(err);
        setMessage(
          err?.message ||
            'Something went wrong while finalizing payment.'
        );
        setUpdating(false);
      }
    }

    finalizePayment();

    return () => {
      mounted = false;
    };
  }, [ideaId, supabase, router]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/80">{message}</p>

      {ideaId && (
        <p className="text-sm text-white/70">
          Idea ID:{' '}
          <span className="font-mono text-emerald-200">
            {ideaId}
          </span>
        </p>
      )}

      {!updating && (
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/my-ideas"
            className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300"
          >
            Go to My Ideas
          </Link>

          <Link
            href="/submit"
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Submit another idea
          </Link>
        </div>
      )}
    </div>
  );
}