'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SubmitSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [message, setMessage] = useState('Finalizing your deposit...');

  useEffect(() => {
    let done = false;

    async function finalizeDeposit() {
      try {
        const ideaId = searchParams.get('idea');

        if (!ideaId) {
          setMessage('Missing payment reference.');
          return;
        }

        // STEP 1: mark idea as paid
        const { data: idea, error } = await supabase
          .from('ideas')
          .update({
            payment_status: 'paid',
          })
          .eq('id', ideaId)
          .select('id, title, verification_code')
          .single();

        if (error || !idea) {
          console.error('PAYMENT FINALIZE ERROR:', error);
          setMessage('Unable to finalize payment.');
          return;
        }

        // STEP 2: send payment success email safely
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.email) {
          try {
            await fetch('/api/send-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'payment_success',
                email: user.email,
                ideaTitle: idea.title,
                verificationCode: idea.verification_code,
              }),
            });
          } catch (mailErr) {
            console.error('EMAIL SEND ERROR:', mailErr);
          }
        }

        // STEP 3: redirect to vault
        if (!done) {
          setMessage(
            'Payment successful. Redirecting to your Ideas Vault...'
          );

          setTimeout(() => {
            router.replace(
              `/my-ideas?paid=1&code=${encodeURIComponent(
                idea.verification_code
              )}`
            );
          }, 1800);
        }
      } catch (err) {
        console.error(err);
        setMessage('Payment confirmation failed.');
      }
    }

    finalizeDeposit();

    return () => {
      done = true;
    };
  }, [searchParams, router, supabase]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6">
      <div className="max-w-xl rounded-3xl border border-emerald-500/20 bg-white/5 p-10 text-center">
        <h1 className="text-3xl font-extrabold text-emerald-300">
          Deposit Successful
        </h1>

        <p className="mt-4 text-white/70">{message}</p>
      </div>
    </main>
  );
}