'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

// ---------- Types ----------
type Campaign = {
  id: string;
  title: string;
  blurb: string;
  category: string;
  goalUsd: number;
  raisedUsd: number;
  backers: number;
  cover?: string | null;
  protected?: boolean;
};

// ---------- Seed (baseline) ----------
const SEED: Campaign[] = [
  {
    id: 'c1',
    title: 'CleanRide247 (Pilot Units)',
    blurb: 'Manufacture 10 pilot self-cleaning kits for real-world fleet testing.',
    category: 'Mobility & Safety',
    goalUsd: 15000,
    raisedUsd: 4200,
    backers: 37,
  },
  {
    id: 'c2',
    title: 'Viewviq Smart Mirror (Beta Hardware)',
    blurb: 'Hardware iteration + night-vision module validation with city partners.',
    category: 'Smart Security & Tech',
    goalUsd: 28000,
    raisedUsd: 19650,
    backers: 112,
    protected: true,
  },
  {
    id: 'c3',
    title: 'EcoChairPress (Tooling)',
    blurb: 'Build steel molds and safety-certify the recycled-plastic chair line.',
    category: 'Eco & Sustainability',
    goalUsd: 12000,
    raisedUsd: 9050,
    backers: 64,
  },
];

// ---------- LocalStorage ----------
const LS_DELTAS_KEY = 'bui_fund_deltas_v1';
type DeltaMap = Record<string, { raisedDelta: number; backersDelta: number }>;

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

function Progress({ value }: { value: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
      <div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export default function FundPage() {
  const [base] = useState<Campaign[]>(SEED);
  const [deltas, setDeltas] = useState<DeltaMap>({});

  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'All' | string>('All');

  const [pledgeOpen, setPledgeOpen] = useState(false);
  const [active, setActive] = useState<Campaign | null>(null);
  const [amount, setAmount] = useState<number>(25);

  // load deltas
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(LS_DELTAS_KEY);
    if (raw) {
      try { setDeltas(JSON.parse(raw) || {}); } catch {}
    }
  }, []);

  // persist deltas
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LS_DELTAS_KEY, JSON.stringify(deltas));
  }, [deltas]);

  // apply deltas
  const campaigns = useMemo(() => {
    return base.map(c => {
      const d = deltas[c.id];
      return d
        ? { ...c, raisedUsd: c.raisedUsd + d.raisedDelta, backers: c.backers + d.backersDelta }
        : c;
    });
  }, [base, deltas]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(campaigns.map(d => d.category)))],
    [campaigns]
  );

  const filtered = useMemo(
    () =>
      campaigns.filter(d =>
        (cat === 'All' || d.category === cat) &&
        (d.title + ' ' + d.blurb).toLowerCase().includes(q.toLowerCase())
      ),
    [q, cat, campaigns]
  );

  function openPledge(c: Campaign) {
    setActive(c);
    setAmount(25);
    setPledgeOpen(true);
  }

  function confirmPledge() {
    if (!active || !amount || amount <= 0) {
      setPledgeOpen(false);
      return;
    }
    setDeltas(prev => {
      const curr = prev[active.id] || { raisedDelta: 0, backersDelta: 0 };
      return { ...prev, [active.id]: { raisedDelta: curr.raisedDelta + amount, backersDelta: curr.backersDelta + 1 } };
    });
    setPledgeOpen(false);
    alert(`🎉 Thanks! You pledged ${fmt(amount)} to “${active.title}”. (Saved locally)`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-white">
      {/* Top banner to match site */}
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold">
          A <span className="bg-gradient-to-r from-emerald-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">Fund</span>{' '}
          for{' '}
          <span className="bg-gradient-to-r from-emerald-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
            Unique Ideas
          </span>
        </h1>
        <p className="mt-3 text-white/70 max-w-2xl mx-auto">
          Back promising innovations. Transparent progress. Confidential details available under NDA.
        </p>
        <div className="mt-5 flex items-center justify-center gap-4 text-sm">
          <Link href="/" className="underline text-emerald-300">← Back Home</Link>
          <Link href="/legal/terms" className="underline text-white/70 hover:text-white">Funding Terms</Link>
        </div>
      </section>

      {/* Controls */}
      <section className="mx-auto max-w-6xl px-6 mt-6 flex flex-col md:flex-row gap-3">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search campaigns…"
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/15 outline-none focus:border-white/30 flex-1"
        />
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs transition ${
                c === cat ? 'border-white/40 bg-white/15' : 'border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Cards */}
      <section className="mx-auto max-w-6xl px-6 mt-6 grid sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
        {filtered.map(c => {
          const pct = (c.raisedUsd / c.goalUsd) * 100;

          return (
            <article
              key={c.id}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:border-emerald-400 transition"
            >
              <div className="flex items-center justify-between">
                <h2
                  className={`text-lg font-semibold ${
                    c.protected ? 'blur-[2px] select-none pointer-events-none' : ''
                  }`}
                  title={c.protected ? 'Details available after NDA.' : undefined}
                >
                  {c.title}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/70">
                  {c.category}
                </span>
              </div>

              <p
                className={`mt-2 text-sm text-white/80 ${
                  c.protected ? 'blur-sm select-none pointer-events-none' : ''
                }`}
              >
                {c.blurb}
              </p>

              {c.protected && (
                <p className="mt-2 text-xs text-amber-300">🔒 Confidential workstream — request NDA for full scope.</p>
              )}

              <div className="mt-5 space-y-2">
                <Progress value={pct} />
                <div className="flex items-center justify-between text-sm text-white/80">
                  <span>{fmt(c.raisedUsd)} raised / {fmt(c.goalUsd)} goal</span>
                  <span>{c.backers} backers</span>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() => openPledge(c)}
                  className="rounded-xl bg-white text-black font-semibold px-3 py-2 hover:opacity-90"
                >
                  Pledge
                </button>
                <Link
                  href="/fund"
                  className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs hover:bg-white/15"
                >
                  Learn more
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      {/* Modal */}
      {pledgeOpen && active && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-5 shadow-xl">
            <h3 className="text-lg font-semibold">Pledge to “{active.title}”</h3>
            <p className="text-sm text-white/70 mt-1">
              Demo only — your pledge is stored locally to update the progress bar.
            </p>

            <label className="block mt-4 text-sm">
              Amount (USD)
              <input
                type="number"
                min={1}
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
              />
            </label>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setPledgeOpen(false)}
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
              >
                Cancel
              </button>
              <button
                onClick={confirmPledge}
                className="rounded-xl bg-white text-black font-semibold px-3 py-2 text-sm hover:opacity-90"
              >
                Confirm (Save locally)
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
