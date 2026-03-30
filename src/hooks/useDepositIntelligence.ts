'use client';

import { useMemo } from 'react';
import { analyzeDeposit } from '@/lib/deposit-intelligence';

export function useDepositIntelligence(title: string, summary: string) {
  return useMemo(() => {
    return analyzeDeposit(title, summary);
  }, [title, summary]);
}