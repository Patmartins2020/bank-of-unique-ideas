'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import VerifyContent from './VerifyContent';

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ padding: 50 }}>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}