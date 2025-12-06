'use client';
import ResponsiveVideo from '../components/ResponsiveVideo';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login'); // redirect after splash
    }, 20000); // duration in ms (1 min)
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="min-h-screen grid place-items-center bg-[#0b1120] text-white px-6 py-12">
      <div className="max-w-3xl text-center space-y-6">
        <h1 className="text-4xl font-extrabold text-emerald-400">
          Welcome to the Bank of Unique Ideas
        </h1>
        <p className="text-white/70 text-lg">
          Where vision meets innovation and every idea finds value.
        </p>

        {/* 🔹 Avatar video intro */}
        <ResponsiveVideo
          src="/videos/intro.mp4"
          poster="/videos/poster.jpg"
        />

        <p className="text-white/60 text-sm italic">
          “Every great change began with one idea.”
        </p>
      </div>
    </main>
  );
}
