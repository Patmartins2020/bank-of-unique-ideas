'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { supabase } from '@/lib/supabase';

const links = [
  { href: '/', label: 'Home' },
   
  { href: '/fund', label: 'Fund Me' },
  { href: '/partnership', label: 'Partnership' },
  { href: '/verify', label: 'Verify Certificate' },
  { href: '/about', label: 'About' },
 
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // ---------------- AUTH STATE ----------------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!cancelled) setUserId(data?.user?.id ?? null);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // ---------------- SECRET ADMIN ACCESS ----------------
  const [tapCount, setTapCount] = useState(0);

  function handleSecretAdminAccess() {
    if (tapCount === 0) {
      setTapCount(1);
      setTimeout(() => setTapCount(0), 500);
    } else {
      router.push('/admin-login');
    }
  }

  // ---------------- LOGOUT ----------------
  async function handleLogout() {
    await supabase.auth.signOut();
    setOpen(false);
    router.replace('/');
    router.refresh();
  }

  // ---------------- SMART DEPOSIT LINK ----------------
  const depositLink = userId ? '/deposit' : '/signup';

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1120] to-[#0b1120]/70 backdrop-blur" />

      <div className="relative mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">

        {/* BRAND */}
        <button
          onClick={handleSecretAdminAccess}
          className="flex items-center gap-2 cursor-pointer"
          aria-label="Bank Logo"
        >
          <span className="inline-grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-black font-extrabold">
            B
          </span>

          <span className="font-semibold text-white">
            Bank of Unique Ideas
          </span>
        </button>

        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-6">

          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'text-sm text-white/80 hover:text-white transition',
                pathname === link.href && 'text-emerald-300'
              )}
            >
              {link.label}
            </Link>
          ))}

          {/* 🚀 Deposit Idea Button */}
          <Link
            href={depositLink}
            className="text-sm px-3 py-1.5 rounded-md bg-emerald-500 text-black font-semibold hover:bg-emerald-400 flex items-center gap-1"
          >
            🚀 Deposit Idea
          </Link>

          <div className="h-6 w-px bg-white/15" />

          {!userId ? (
            <>
              <Link
                href="/login"
                className="text-sm text-white/80 hover:text-white"
              >
                Log in
              </Link>

              <Link
                href="/signup"
                className="text-sm px-3 py-1.5 rounded-md bg-emerald-500 text-black font-semibold hover:bg-emerald-400"
              >
                Sign up
              </Link>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 rounded-md border border-white/20 text-white/90 hover:bg-white/10"
            >
              Log out
            </button>
          )}
        </div>

        {/* MOBILE BURGER */}
        <button
          className="md:hidden h-9 w-9 grid place-items-center rounded-md border border-white/15 text-white/90"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden relative border-t border-white/10 bg-[#0b1120]/95 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-2">

            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'py-2 text-white/90',
                  pathname === link.href && 'text-emerald-300'
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* 🚀 Deposit Idea Mobile */}
            <Link
              href={depositLink}
              onClick={() => setOpen(false)}
              className="py-2 text-emerald-300 font-semibold flex items-center gap-1"
            >
              🚀 Deposit Idea
            </Link>

            <div className="my-2 h-px bg-white/10" />

            {!userId ? (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="py-2 text-white/90"
                >
                  Log in
                </Link>

                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="py-2 text-emerald-300 font-semibold"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="py-2 text-left text-white/90 hover:text-white"
              >
                Log out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}