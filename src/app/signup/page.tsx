'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

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
  const [role, setRole] = useState<Role>('inventor');

  // shared
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');

  // inventor
  const [country, setCountry] = useState('');

  // investor (multi-select + other)
  const [areas, setAreas] = useState<string[]>([]);
  const [areaOther, setAreaOther] = useState('');

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleArea(a: string) {
    setAreas(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null);

    if (!fullName.trim()) return setErr('Please enter your full name.');
    if (!email.trim()) return setErr('Please enter your email.');
    if (pwd.length < 6) return setErr('Password must be at least 6 characters.');
    if (pwd !== pwd2) return setErr('Passwords do not match.');

    if (role === 'inventor' && !country.trim()) {
      return setErr('Please enter your country.');
    }

    let areaFinal: string | null = null;
    if (role === 'investor') {
      const cleaned = [
        ...areas,
        ...(areaOther.trim() ? [areaOther.trim()] : []),
      ].map(s => s.trim()).filter(Boolean);
      if (cleaned.length === 0) return setErr('Please choose at least one area of interest.');
      areaFinal = cleaned.join(', ');
    }

    try {
      setLoading(true);
      // Sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pwd,
        options: { emailRedirectTo: `${window.location.origin}/login` },
      });
      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error('Sign up succeeded but no user returned.');

      // Insert profile row
      const { error: pErr } = await supabase.from('profiles').insert({
        id: user.id,
        full_name: fullName.trim(),
        role,
        area_of_interest: role === 'investor' ? areaFinal : null,
        country: role === 'inventor' ? country.trim() : null,
      });
      if (pErr) throw pErr;

      setMsg('Account created! You can now log in.');
      // Redirect based on role
      if (role === 'inventor') router.push('/submit');
      else router.push('/');
    } catch (e: any) {
      setErr(e?.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b1120] text-white">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <Link href="/" className="text-emerald-300 hover:text-emerald-200">← Back</Link>
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
                role === 'inventor' ? 'bg-emerald-400 text-black' : 'bg-white/8 text-white/80'
              }`}
            >
              Inventor
            </button>
            <button
              type="button"
              onClick={() => setRole('investor')}
              className={`rounded-md px-3 py-2 text-sm font-semibold ring-1 ring-white/15 ${
                role === 'investor' ? 'bg-emerald-400 text-black' : 'bg-white/8 text-white/80'
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
                  placeholder="e.g., Nigeria"
                />
              </div>
            )}

            {/* Investor multi-select */}
            {role === 'investor' && (
              <div className="mt-1">
                <label className="mb-1 block text-sm text-white/80">Areas of Interest (choose one or more)</label>

                <div className="grid grid-cols-1 gap-2 rounded-md border border-white/10 bg-black/30 p-3 sm:grid-cols-2">
                  {AREAS.map(item => (
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

                {/* Other */}
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
              <Link href="/login" className="text-emerald-300 underline">Log in</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
