'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Props = {
  searchParams: Promise<{
    idea?: string;
  }>;
};

export default async function SubmitSuccessPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  return <SuccessClient ideaId={params.idea} />;
}

function SuccessClient({ ideaId }: { ideaId?: string }) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [message, setMessage] = useState(
    'Finalizing your deposit...'
  );

  useEffect(() => {
    async function finalizeIdea() {
      try {
        if (!ideaId) {
          setMessage('Missing idea reference.');
          return;
        }

        // ✅ CORRECT BOUI LEGAL FLOW
        const { error } = await supabase
          .from('ideas')
          .update({
            payment_status: 'paid',
            status: 'pending',
          })
          .eq('id', ideaId);

        if (error) {
          console.error(error);
          setMessage(
            'Payment succeeded but admin queue update failed.'
          );
          return;
        }

        setMessage(
          'Payment successful. Your idea has been sent to the BOUI admin review queue.'
        );

        setTimeout(() => {
          router.push('/my-ideas');
        }, 2500);
      } catch (err) {
        console.error(err);
        setMessage('Something went wrong after payment.');
      }
    }

    finalizeIdea();
  }, [ideaId, router, supabase]);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
        <h1 className="text-3xl font-bold text-emerald-300 mb-4">
          Deposit Successful
        </h1>
        <p className="text-white/70">{message}</p>
      </div>
    </main>
  );
}