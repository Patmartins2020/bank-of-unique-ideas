'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export default function SuccessClient() {
  const sp = useSearchParams();

  const ideaId = useMemo(() => sp.get('idea') || '', [sp]);

  return (
    <div className="space-y-3">
      {ideaId ? (
        <p className="text-sm text-white/80">
          Idea ID: <span className="font-mono text-emerald-200">{ideaId}</span>
        </p>
      ) : (
        <p className="text-sm text-amber-200">
          No idea ID found in the URL. (This is okay if user landed here manually.)
        </p>
      )}

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

      <p className="text-xs text-white/50">
        Note: If the webhook is set correctly, your payment status will change to <b>paid</b> within seconds.
      </p>
    </div>
  );
}