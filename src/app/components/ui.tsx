// src/components/ui.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import clsx from 'clsx';

// 🌿 PageShell — main layout wrapper for all pages
export function PageShell({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#030712] to-[#0c0f1a] text-white">
      <header className="sticky top-0 z-10 backdrop-blur-sm border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-black tracking-tight text-emerald-400 text-xl"
          >
            Bank of Unique Ideas
          </Link>
          {right}
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-1">{title}</h1>
        {subtitle && <p className="text-gray-400 mb-6">{subtitle}</p>}
        {children}
      </section>
    </main>
  );
}

// 🌿 Reusable button
export function Button({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={clsx(
        'px-3 py-1.5 rounded-md font-semibold transition-all',
        'bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-60',
        className
      )}
    />
  );
}

// 🌿 Reusable card
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={clsx(
        'rounded-lg border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-sm',
        className
      )}
    />
  );
}

// 🌿 Section title
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold mb-2 text-emerald-400">{children}</h2>
  );
}
