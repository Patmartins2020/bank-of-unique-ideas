'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Button from '../components/Button';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const trimmedEmail = email.trim();
    const trimmedPwd = pwd.trim();

    if (!trimmedEmail || !trimmedPwd) {
      setErr('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user, session },
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPwd,
      });

      if (authError) {
        if (
          authError.message.toLowerCase().includes('invalid') ||
          authError.message.toLowerCase().includes('credentials')
        ) {
          setErr('Invalid login credentials.');
        } else {
          setErr(authError.message || 'Login failed.');
        }
        return;
      }

      if (!user || !session) {
        setErr('Login failed. No active session.');
        return;
      }

      // ---- determine role ----
      const adminEmail =
        process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'patmartinsbest@gmail.com';

      let role = 'inventor';

      if (user.email === adminEmail) {
        role = 'admin';
      } else {
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (prof?.role) role = prof.role;
      }

      // ---- redirect ----
      if (role === 'admin') router.replace('/dashboard');
      else if (role === 'investor') router.replace('/investor/ideas');
      else if (role === 'inventor') router.replace('/my-ideas');
      else router.replace('/');
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-100">
          Access your vault
        </h1>

        <p className="text-gray-400 mt-1 mb-6 text-sm">
          Sign in with your email and password.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Password
            </label>

            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                className="w-full pr-14"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoComplete="current-password"
              />

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
              >
                {showPwd ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {err && (
            <p className="text-sm text-red-400">{err}</p>
          )}

          {/* BUTTON (USING YOUR NEW SYSTEM) */}
          <Button>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-4 text-xs text-gray-400">
          Forgot password?{' '}
          <Link href="/forgot-password" className="text-green-400 underline">
            Reset it
          </Link>
        </p>
      </div>
    </main>
  );
}