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

  useEffect(() => {
    async function handleSuccess() {
      if (!ideaId) {
        setMessage('Missing idea reference.');
        return;
      }

      try {
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

        setMessage('Redirecting to your certificate...');

        setTimeout(() => {
          router.replace(`/verify?code=${data.verification_code}`);
        }, 1500);

      } catch (err) {
        console.error(err);
        setMessage('Something went wrong after payment.');
      }
    }

    handleSuccess();
  }, [ideaId, router, supabase]);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
        <h1 className="text-3xl font-bold text-emerald-300 mb-4">
          Payment Successful 🎉
        </h1>
        <p className="text-white/70">{message}</p>
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