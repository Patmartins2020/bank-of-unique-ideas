export const dynamic = 'force-dynamic';

'use client';

import { Suspense } from 'react';
import ContactClient from './ContactClient';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading…</div>}>
      <ContactClient />
    </Suspense>
  );
}