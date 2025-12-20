'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SynthesiaEmbed from '../components/SynthesiaEmbed';
import { supabase } from '../lib/supabase';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;

        // ✅ If logged in, go to user's area
        if (user) {
          router.replace('/my-ideas');
        } else {
          router.replace('/login');
        }
      } catch {
        router.replace('/login');
      }
    }, 100000); // ✅ 60 seconds

    return () => clearTimeout(timer);
  }, [router]);

  const handleSkip = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      router.replace(data?.user ? '/my-ideas' : '/login');
    } catch {
      router.replace('/login');
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-[#0b1120] text-white px-6 py-12">
      <div className="max-w-3xl text-center space-y-6">
        <h1 className="text-4xl font-extrabold text-emerald-400">
          Welcome to the Global Bank of Unique Ideas
        </h1>

        <p className="text-white/70 text-lg">
          Where innovation is protected, valued, and empowered.
        </p>

        <div className="relative rounded-xl overflow-hidden">
          <SynthesiaEmbed videoId="306f09ef-6f1a-48fe-a2d7-0a3e53574b96" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
        </div>

        <p className="text-white/60 text-sm italic">
          “Every great change began with one idea.”
        </p>

        <button
          onClick={handleSkip}
          className="mt-2 rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-black hover:bg-emerald-300"
        >
          Skip
        </button>
      </div>
    </main>
  );
}