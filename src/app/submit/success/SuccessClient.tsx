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
          if (mounted) {
            setMessage('No idea ID found in URL.');
            setUpdating(false);
          }
          return;
        }

        // 1) Mark payment as successful
        const { error: updateError } = await supabase
          .from('ideas')
          .update({
            payment_status: 'paid',
            status: 'pending',
          })
          .eq('id', ideaId);

        if (updateError) {
          throw updateError;
        }

        // 2) Fetch idea details
        const { data: idea, error: ideaError } = await supabase
          .from('ideas')
          .select(
            'id, title, verification_code, user_id'
          )
          .eq('id', ideaId)
          .single();

        if (ideaError || !idea) {
          throw ideaError || new Error('Idea not found.');
        }

        // 3) Fetch inventor profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', idea.user_id)
          .single();

        // 4) Send premium BOUI receipt email
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
                  'BOUI Official Deposit Receipt | ' +
                  idea.verification_code,
                html: `
<div style="margin:0;padding:0;background:#0b1120;font-family:Arial,sans-serif;color:#ffffff;">
  <div style="max-width:680px;margin:0 auto;padding:40px 24px;">
    <div style="background:linear-gradient(135deg,#0f172a,#111827);border:1px solid rgba(255,255,255,0.08);border-radius:18px;overflow:hidden;">

      <div style="padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.08);">
        <div style="font-size:28px;font-weight:800;letter-spacing:0.5px;color:#ffffff;">
          BANK OF UNIQUE IDEAS
        </div>
        <div style="margin-top:6px;font-size:14px;color:#94a3b8;">
          Official Deposit Payment Receipt
        </div>
      </div>

      <div style="padding:24px 32px;background:rgba(16,185,129,0.08);border-top:1px solid rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.05);">
        <div style="font-size:26px;font-weight:700;color:#34d399;">
          Payment Successful ✅
        </div>
        <div style="margin-top:8px;font-size:15px;color:#cbd5e1;">
          Your BOUI intellectual property deposit has been securely received.
        </div>
      </div>

      <div style="padding:32px;">
        <p style="font-size:16px;color:#e2e8f0;margin:0 0 20px;">
          Dear ${profile.full_name || 'Inventor'},
        </p>

        <div style="background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:20px;">
          <div style="margin-bottom:14px;">
            <span style="color:#94a3b8;">Innovation:</span>
            <div style="font-size:18px;font-weight:700;color:#ffffff;margin-top:4px;">
              ${idea.title}
            </div>
          </div>

          <div style="margin-bottom:14px;">
            <span style="color:#94a3b8;">Verification Code:</span>
            <div style="font-size:18px;font-weight:700;color:#22d3ee;margin-top:4px;">
              ${idea.verification_code}
            </div>
          </div>

          <div style="margin-bottom:14px;">
            <span style="color:#94a3b8;">Payment Status:</span>
            <div style="font-size:18px;font-weight:700;color:#34d399;">
              PAID & SECURED
            </div>
          </div>

          <div>
            <span style="color:#94a3b8;">Registry Status:</span>
            <div style="font-size:18px;font-weight:700;color:#facc15;">
              Pending BOUI Administrative Verification
            </div>
          </div>
        </div>

        <p style="margin-top:24px;font-size:15px;line-height:1.7;color:#cbd5e1;">
          This receipt confirms that your innovation has been successfully
          timestamped within the BOUI protected deposit registry.
          Your certificate will automatically unlock once administrative verification is completed.
        </p>

        <p style="margin-top:24px;">
          <a href="https://bankofuniqueideas.com/my-ideas"
             style="display:inline-block;padding:12px 18px;background:#10b981;color:#000;text-decoration:none;border-radius:999px;font-weight:bold;">
            Open My Ideas Vault
          </a>
        </p>

        <div style="margin-top:28px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.08);font-size:13px;color:#94a3b8;">
          BOUI Registry • Trusted Innovation Protection • Legal Timestamp Proof
        </div>
      </div>
    </div>
  </div>
</div>
                `,
              }),
            });
          } catch (mailErr) {
            console.error('Receipt email failed:', mailErr);
          }
        }

        if (mounted) {
          setMessage(
            'Payment successful. Your idea has been sent to BOUI admin for review. A premium receipt email has been sent.'
          );

          setTimeout(() => {
            router.push('/my-ideas');
          }, 2200);

          setUpdating(false);
        }
      } catch (err: any) {
        console.error(err);

        if (mounted) {
          setMessage(
            err?.message ||
              'Something went wrong while finalizing payment.'
          );
          setUpdating(false);
        }
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