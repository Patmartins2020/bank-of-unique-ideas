'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Mode = 'inventor' | 'investor';

const INTERESTS = [
  'Mobility & Safety',
  'Eco & Sustainability',
  'FinTech & Payments',
  'AgriTech & Food',
  'AI & Data',
  'Hardware & Robotics',
  'Media & Entertainment',
  'Smart Security & Tech',
  'HealthTech & MedTech',
  'EdTech',
  'Energy & CleanTech',
  'Consumer & Lifestyle',
  'Logistics & Supply Chain',
  'GovTech & Civic',
];

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [mode, setMode] = useState<Mode>('inventor');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [otherArea, setOtherArea] = useState('');

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const interestsArray = useMemo(() => {
    const parts = [...selectedInterests];
    if (otherArea.trim()) parts.push(otherArea.trim());
    return parts.length > 0 ? parts : null;
  }, [selectedInterests, otherArea]);

  function toggleInterest(label: string) {
    setSelectedInterests((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  }

  function redirectAfterSignup(role: Mode) {
    // Inventor goes to their vault
    if (role === 'inventor') {
      router.replace('/my-ideas');
      router.refresh();
      return;
    }
    // Investor goes to home (blurred ideas)
    router.replace('/');
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const nameTrim = fullName.trim();
    const emailTrim = email.trim();
    const pwdTrim = pwd.trim();
    const confirmTrim = confirmPwd.trim();

    if (!nameTrim) return setErr('Please enter your full name.');
    if (!emailTrim) return setErr('Please enter your email.');
    if (!pwdTrim || pwdTrim.length < 6) return setErr('Password must be at least 6 characters.');
    if (pwdTrim !== confirmTrim) return setErr('Passwords do not match.');

    try {
      setLoading(true);

      const { data: signData, error: signErr } = await supabase.auth.signUp({
        email: emailTrim,
        password: pwdTrim,
        options: {
          data: {
            role: mode,
            full_name: nameTrim,
            interests: interestsArray,
          },
        },
      });

      if (signErr) {
        console.error('signUp error:', signErr);
        setErr(signErr.message || 'Could not create account.');
        return;
      }

      // If email confirmation is ON, session can be null. That's fine.
      const session = signData.session;

      if (session) {
        setMsg('✅ Account created. Redirecting…');
        // session exists => user is logged in right away
        setTimeout(() => redirectAfterSignup(mode), 450);
      } else {
        setMsg('✅ Account created. Please check your email to confirm, then log in.');
        setTimeout(() => router.push('/login'), 1200);
      }
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-emerald-300 hover:text-emerald-200">
            ← Home
          </Link>
          <h1 className="text-lg font-semibold">Sign Up</h1>
          <div />
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
          {/* Mode toggle */}
          <div className="mb-6 flex gap-2">
            <button
              type="button"
              onClick={() => setMode('inventor')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${
                mode === 'inventor' ? 'bg-emerald-400 text-black' : 'bg-black/40 text-white/80'
              }`}
            >
              Inventor
            </button>
            <button
              type="button"
              onClick={() => setMode('investor')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${
                mode === 'investor' ? 'bg-emerald-400 text-black' : 'bg-black/40 text-white/80'
              }`}
            >
              Investor
            </button>
          </div>

          <form onSubmit={onSubmit} className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm text-white/80">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-white/80">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-white/80">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2 pr-12 text-sm outline-none focus:border-emerald-400"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-white/70 hover:text-white hover:bg-white/10"
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-white/80">Confirm</label>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2 pr-12 text-sm outline-none focus:border-emerald-400"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-white/70 hover:text-white hover:bg-white/10"
                    aria-label={showConfirmPwd ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPwd ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-1 text-sm text-white/80">Areas of Interest (choose one or more)</p>
              <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 md:grid-cols-3">
                {INTERESTS.map((label) => (
                  <label
                    key={label}
                    className="flex items-center gap-2 rounded-md bg-black/40 px-2 py-1 border border-white/10 hover:border-emerald-400/40"
                  >
                    <input
                      type="checkbox"
                      checked={selectedInterests.includes(label)}
                      onChange={() => toggleInterest(label)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-white/80">Other (optional)</label>
              <input
                value={otherArea}
                onChange={(e) => setOtherArea(e.target.value)}
                placeholder="Add a custom area..."
                className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              />
            </div>

            {err && <p className="text-sm text-rose-300">{err}</p>}
            {msg && <p className="text-sm text-emerald-300">{msg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-60"
            >
              {loading ? 'Creating account…' : `Create ${mode === 'inventor' ? 'Inventor' : 'Investor'} Account`}
            </button>

            <p className="mt-2 text-xs text-white/70">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-300 underline">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}