'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

function SubmitSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  const ideaId = searchParams.get('ideaId');

  const [message, setMessage] = useState('Finalizing your certificate...');
  const [verificationCode, setVerificationCode] = useState<string | null>(null);

  useEffect(() => {
    async function handleSuccess() {
      if (!ideaId) {
        setMessage('Missing idea reference.');
        return;
      }

      try {
        // ✅ mark as paid
        const { error: updateError } = await supabase
          .from('ideas')
          .update({
            payment_status: 'paid',
            status: 'pending',
          })
          .eq('id', ideaId);

        if (updateError) {
          console.error(updateError);
          setMessage('Payment saved, but update failed.');
          return;
        }

        // ✅ get verification code
        const { data, error } = await supabase
          .from('ideas')
          .select('verification_code')
          .eq('id', ideaId)
          .single();

        if (error || !data) {
          console.error(error);
          setMessage('Could not load certificate.');
          return;
        }

        setVerificationCode(data.verification_code);

        setMessage('Payment successful! Your Idea is now under review<br />You will be redirected to your Idea page now.');

        // ✅ AUTO REDIRECT (after delay)
        setTimeout(() => {
          router.push(`/my-ideas`);
        }, 2500);

      } catch (err) {
        console.error(err);
        setMessage('Something went wrong after payment.');
      }
    }

    handleSuccess();
  }, [ideaId, router, supabase]);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center max-w-md w-full">

        <h1 className="text-3xl font-bold text-emerald-300 mb-4">
          Payment Successful 🎉
        </h1>

        <p className="text-white/70 mb-6">{message}</p>

        {/* ✅ ACTION BUTTONS */}
        {verificationCode && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => router.push(`/verify?code=${verificationCode}`)}
              style={{
                padding: '10px 16px',
                borderRadius: 20,
                background: '#00f2fe',
                color: '#000',
                fontWeight: 600,
              }}
            >
              View Certificate
            </button>

            <button
              onClick={() => router.push('/my-ideas')}
              style={{
                padding: '10px 16px',
                borderRadius: 20,
                background: '#1e293b',
                color: '#fff',
              }}
            >
              My Ideas
            </button>
          </div>
        )}

      </div>
    </main>
  );
}

export default function SubmitSuccessPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60 }}>Loading...</div>}>
      <SubmitSuccessContent />
    </Suspense>
  );
}