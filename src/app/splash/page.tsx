'use client';

import { useRouter } from 'next/navigation';
import SynthesiaEmbed from '../components/SynthesiaEmbed';

export default function SplashPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#0b1120] text-white px-6 py-12 flex items-center justify-center">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* Brand Header */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-400">
          Global Bank of Unique Ideas
        </h1>

        <p className="text-lg text-white/70 max-w-2xl mx-auto">
          A protected marketplace where inventors showcase ideas and investors
          discover opportunities — securely, transparently, and globally.
        </p>

        {/* Video */}
        <div className="relative rounded-xl overflow-hidden max-w-3xl mx-auto">
          <SynthesiaEmbed videoId="306f09ef-6f1a-48fe-a2d7-0a3e53574b96" />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-black/40" />
        </div>

        <p className="text-sm italic text-white/60">
          “Every great innovation starts as an idea worth protecting.”
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button
            onClick={() => router.push('/login')}
            className="rounded-full bg-emerald-400 px-6 py-2.5 text-sm font-semibold text-black hover:bg-emerald-300 transition"
          >
            Log in
          </button>

          <button
            onClick={() => router.push('/signup')}
            className="rounded-full border border-emerald-400 px-6 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/10 transition"
          >
            Sign up
          </button>
        </div>

        {/* Optional teaser (future blurred ideas) */}
        <p className="pt-6 text-xs text-white/50">
          Explore verified ideas. Full access requires an account.
        </p>
      </div>
    </main>
  );
}