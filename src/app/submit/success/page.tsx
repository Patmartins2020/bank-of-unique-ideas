'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SubmitSuccess() {
  const sp = useSearchParams();
  const router = useRouter();
  const ideaId = sp.get("ideaId");

  useEffect(() => {
    // Small delay then go to inventor vault
    const t = setTimeout(() => router.replace("/my-ideas"), 1200);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <h1 className="text-2xl font-extrabold text-emerald-300">✅ Payment Successful</h1>
        <p className="mt-2 text-white/70">
          Your idea deposit is confirmed. Your submission will appear after admin approval.
        </p>
        <p className="mt-3 text-xs text-white/50 break-all">Idea ID: {ideaId || "—"}</p>
      </div>
    </main>
  );
}