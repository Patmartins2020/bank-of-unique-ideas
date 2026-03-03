import { Suspense } from 'react';
import SuccessClient from './SuccessClient';

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-white px-4 py-10">
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-extrabold text-emerald-300">Payment success ✅</h1>
        <p className="mt-2 text-sm text-white/70">
          Please wait while we confirm your payment and update your idea status.
        </p>

        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-white/60">Loading receipt…</p>}>
            <SuccessClient />
          </Suspense>
        </div>
      </div>
    </main>
  );
}