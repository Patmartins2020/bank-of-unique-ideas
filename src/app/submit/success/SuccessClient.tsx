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
      if (!ideaId) {
        if (mounted) {
          setMessage('No idea ID found in URL.');
          setUpdating(false);
        }
        return;
      }

      // 1) Mark payment successful
      const { error: updateError } = await supabase
        .from('ideas')
        .update({
          payment_status: 'paid',
          status: 'pending',
        })
        .eq('id', ideaId);

      if (updateError) {
        if (mounted) {
          console.error(updateError);
          setMessage(
            `Payment update failed: ${updateError.message}`
          );
          setUpdating(false);
        }
        return;
      }

      // 2) Fetch idea details
      const { data: idea } = await supabase
        .from('ideas')
        .select(
          'id, title, verification_code, user_id'
        )
        .eq('id', ideaId)
        .single();

      // 3) Fetch inventor profile
      if (idea?.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', idea.user_id)
          .single();

        // 4) Send payment receipt email
        if (profile?.email) {
          try {
            await fetch('/api/send-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: profile.email,
                subject:
                  'BOUI Payment Receipt — Idea Deposit Successful',
                html: `
                  <h2 style="color:#10b981;">Payment Successful ✅</h2>
                  <p>Dear ${
                    profile.full_name || 'Inventor'
                  },</p>
                  <p>Your BOUI deposit payment has been successfully received.</p>
                  <p><strong>Idea:</strong> ${idea.title}</p>
                  <p><strong>Verification Code:</strong> ${
                    idea.verification_code
                  }</p>
                  <p>Your idea is now securely queued for BOUI admin verification.</p>
                  <p>Your certificate will unlock after confirmation.</p>
                  <br/>
                  <p>
                    <a href="https://bankofuniqueideas.com/my-ideas"
                       style="display:inline-block;padding:12px 18px;background:#10b981;color:#000;text-decoration:none;border-radius:999px;font-weight:bold;">
                      Open My Ideas Vault
                    </a>
                  </p>
                `,
              }),
            });
          } catch (mailErr) {
            console.error(
              'Receipt email failed:',
              mailErr
            );
          }
        }
      }

      if (mounted) {
        setMessage(
          'Payment successful. Your idea has been sent to BOUI admin for review. A receipt email has been sent.'
        );

        setTimeout(() => {
          router.push('/my-ideas');
        }, 2200);

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