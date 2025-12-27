'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

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

  const [mode, setMode] = useState<Mode>('inventor');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [otherArea, setOtherArea] = useState('');

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function toggleInterest(label: string) {
    setSelectedInterests((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const nameTrim = fullName.trim();
    const emailTrim = email.trim();
    const pwdTrim = pwd.trim();
    const confirmTrim = confirmPwd.trim();

    if (!nameTrim) {
      setErr('Please enter your full name.');
      return;
    }
    if (!emailTrim) {
      setErr('Please enter your email.');
      return;
    }
    if (!pwdTrim || pwdTrim.length < 6) {
      setErr('Password must be at least 6 characters.');
      return;
    }
    if (pwdTrim !== confirmTrim) {
      setErr('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      // 1) Create auth user
      const { data: signData, error: signErr } = await supabase.auth.signUp({
        email: emailTrim,
        password: pwdTrim,
        options: {
          data: { role: mode },
        },
      });

      if (signErr) {
        console.error('signUp error:', signErr);
        setErr(signErr.message || 'Could not create account.');
        return;
      }

      const user = signData.user;
      if (!user) {
        setErr('Sign up succeeded but no user was returned.');
        return;
      }

      // 2) Build area_of_interest string (column is TEXT)
    // 2) Build area_of_interest ARRAY (column is text[])
const interestParts = [...selectedInterests];
if (otherArea.trim()) interestParts.push(otherArea.trim());

const interestsArray =
  interestParts.length > 0 ? interestParts : null;

// 3) Insert profile row – must match RLS (id = auth.uid())
// 3) Insert profile row – non-fatal if it fails
const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: user.id, // link profile row to auth user
    full_name: nameTrim,
    email: emailTrim,
    role: mode === 'inventor' ? 'inventor' : 'investor',
    area_of_interest: interestsArray,
  })
  .select('id')
  .single();

if (profileError) {
  // log it, but do NOT block signup
  console.error('Profile insert error (ignored for now):', profileError);
}

      setMsg('Account created. You can now log in.');
      // small delay then send to login
      setTimeout(() => router.push('/login'), 1000);
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
                mode === 'inventor'
                  ? 'bg-emerald-400 text-black'
                  : 'bg-black/40 text-white/80'
              }`}
            >
              Inventor
            </button>
            <button
              type="button"
              onClick={() => setMode('investor')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold ${
                mode === 'investor'
                  ? 'bg-emerald-400 text-black'
                  : 'bg-black/40 text-white/80'
              }`}
            >
              Investor
            </button>
          </div>

          <form onSubmit={onSubmit} className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm text-white/80">
                Full Name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-white/80">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-white/80">
                  Password
                </label>
                <input
                  type="password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/80">
                  Confirm
                </label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <p className="mb-1 text-sm text-white/80">
                Areas of Interest (choose one or more)
              </p>
              <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 md:grid-cols-3">
                {INTERESTS.map((label) => (
                  <label
                    key={label}
                    className="flex items-center gap-2 rounded-md bg-black/40 px-2 py-1"
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
              <label className="mb-1 block text-sm text-white/80">
                Other (optional)
              </label>
              <input
                value={otherArea}
                onChange={(e) => setOtherArea(e.target.value)}
                placeholder="Add a custom area..."
                className="w-full rounded-md border border-white/15 bg-black/60 px-3 py-2 text-sm outline-none"
              />
            </div>

            {err && <p className="text-sm text-rose-300">{err}</p>}
            {msg && <p className="text-sm text-emerald-300">{msg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create Account'}
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