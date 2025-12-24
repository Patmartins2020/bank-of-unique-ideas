'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function InvestorIdeaDetailPlaceholder() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <main className="min-h-screen bg-[#0b1120] text-white px-6 pt-24 pb-10">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-emerald-300">Idea Detail</h1>
        <p className="text-white/70">
          This is the placeholder for Idea ID: <span className="text-white">{id}</span>
        </p>
        <Link className="text-emerald-300 underline" href="/investor/ideas">
          ← Back to Investor Ideas
        </Link>
      </div>
    </main>
  );
}