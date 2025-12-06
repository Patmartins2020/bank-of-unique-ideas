'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { clsx } from 'clsx';

const links = [
  { href: '/', label: 'Home' },
  { href: '/fund', label: 'Fund Me' },
  { href: '/about', label: 'About' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10">
      {/* background strip */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1120] to-[#0b1120]/70 backdrop-blur" />

      <div className="relative mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-black font-extrabold">
            B
          </span>
          <span className="font-semibold text-white">Bank of Unique Ideas</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(link => (
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
          <div className="h-6 w-px bg-white/15" />
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
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden h-9 w-9 grid place-items-center rounded-md border border-white/15 text-white/90"
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden relative border-t border-white/10 bg-[#0b1120]/95 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-2">
            {links.map(link => (
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
            <div className="my-2 h-px bg-white/10" />
            <Link href="/login" onClick={() => setOpen(false)} className="py-2 text-white/90">
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="py-2 text-emerald-300 font-semibold"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
