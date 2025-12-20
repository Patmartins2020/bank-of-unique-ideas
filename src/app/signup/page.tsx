'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Role = 'inventor' | 'investor';

const AREAS = [
  'Mobility & Safety',
  'Smart Security & Tech',
  'Eco & Sustainability',
  'HealthTech & MedTech',
  'FinTech & Payments',
  'EdTech',
  'AgriTech & Food',
  'Energy & CleanTech',
  'AI & Data',
  'Consumer & Lifestyle',
  'Hardware & Robotics',
  'Logistics & Supply Chain',
  'Media & Entertainment',
  'GovTech & Civic',
] as const;

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [role, setRole] = useState<Role>('inventor');

  // shared fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');

  // inventor
  const [country, setCountry] = useState('');

  // investor
  const [areas, setAreas] = useState<string[]>([]);
  const [areaOther, setAreaOther] = useState('');

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedInterests = useMemo(() => {
    const cleanedOther = areaOther.trim();
    const base = [...areas];
    if (cleanedOther) base.push(cleanedOther);
    // remove duplicates (just in case)
    return Array.from(new Set(base));
  }, [areas, areaOther]);

  function toggleArea(item: string) {
    setAreas((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const cleanedEmail = email.trim();

    if (!cleanedEmail) return setErr('Email is required.');
    if (pwd.length < 6) return setErr('Password must be at least 6 characters.');
    if (pwd !== pwd2) return setErr('Passwords do not match.');

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanedEmail,
        password: pwd,
        options: {
          data: {
            full_name: fullName.trim(),
            role, // ✅ inventor or investor
            interests: role === 'investor' ? selectedInterests : [], // optional array
            country: role === 'inventor' ? country.trim() : country.trim(), // optional (kept as-is)
          },
        },
      });

      if (error) throw error;

      // ✅ If email confirmation is enabled, session is null here.
      if (!data.session) {
        setMsg('Account created. Please check your email to confirm, then log in.');
        return;
      }

      // ✅ Only attempt profile upsert if we actually have an authenticated session
      const userId = data.user?.id;
      if (!userId) {
        setMsg('Account created. Please log in.');
        router.replace('/login');
        return;
      }

      const { error: profErr } = await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            full_name: fullName.trim() || null,
            role,
            // optional: areas_of_interest: selectedInterests,
          },
          { onConflict: 'id' }
        );

      if (profErr) {
        // Do NOT crash signup if profile insert fails.
        // Your trigger already creates profiles.
        console.warn('Profile upsert failed:', profErr.message);
      }

      setMsg('Account created successfully. Redirecting to login...');
      setTimeout(() => router.replace('/login'), 800);
    } catch (e: any) {
      setErr(e?.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b1120] text-white">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <Link href="/" className="text-emerald-300 hover:text-emerald-200">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold">Create Account</h1>
          <div />
        </div>
      </header>

      <section className="mx-auto max-w-md px-4 py-8">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-2xl font-extrabold text-emerald-400">Sign Up</h2>

          {/* Role toggle */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('inventor')}
              className={`rounded-md px-3 py-2 text-sm font-semibold ring-1 ring-white/15 ${
                role === 'inventor'
                  ? 'bg-emerald-400 text-black'
                  : 'bg-white/8 text-white/80'
              }`}
            >
              Inventor
            </button>

            <button
              type="button"
              onClick={() => setRole('investor')}
              className={`rounded-md px-3 py-2 text-sm font-semibold ring-1 ring-white/15 ${
                role === 'investor'
                  ? 'bg-emerald-400 text-black'
                  : 'bg-white/8 text-white/80'
              }`}
            >
              Investor
            </button>
          </div>

          <form onSubmit={onSubmit} className="grid gap-3">
            <div>
              <label className="mb-1 block text-sm text-white/80">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 outline-none"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-white/80">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 outline-none"
                placeholder="you@work.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-white/80">Password</label>
                <input
                  type="password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-white/80">Confirm</label>
                <input
                  type="password"
                  value={pwd2}
                  onChange={(e) => setPwd2(e.target.value)}
                  className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 outline-none"
                />
              </div>
            </div>

            {/* Inventor extra field */}
            {role === 'inventor' && (
              <div>
                <label className="mb-1 block text-sm text-white/80">Country</label>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 outline-none"
                  placeholder="e.g., United States"
                />
              </div>
            )}

            {/* Investor multi-select */}
            {role === 'investor' && (
              <div className="mt-1">
                <label className="mb-1 block text-sm text-white/80">
                  Areas of Interest (choose one or more)
                </label>

                <div className="grid grid-cols-1 gap-2 rounded-md border border-white/10 bg-black/30 p-3 sm:grid-cols-2">
                  {AREAS.map((item) => (
                    <label key={item} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-emerald-400"
                        checked={areas.includes(item)}
                        onChange={() => toggleArea(item)}
                      />
                      <span className="text-white/90">{item}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-2">
                  <label className="mb-1 block text-xs text-white/60">Other (optional)</label>
                  <input
                    value={areaOther}
                    onChange={(e) => setAreaOther(e.target.value)}
                    placeholder="Add a custom area…"
                    className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 outline-none"
                  />
                </div>
              </div>
            )}

            {err && <p className="text-sm text-rose-300">{err}</p>}
            {msg && <p className="text-sm text-emerald-300">{msg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-md bg-emerald-400 px-4 py-2 font-semibold text-black hover:bg-emerald-300 disabled:opacity-60"
            >
              {loading ? 'Creating…' : 'Create Account'}
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