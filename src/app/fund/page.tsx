'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

/* ================= TYPES ================= */
type Campaign = {
  id: string;
  title: string;
  blurb: string;
  category: string;
  goalUsd: number;
  raisedUsd: number;
  backers: number;
  protected?: boolean;
};

type DeltaMap = Record<string, { raisedDelta: number; backersDelta: number }>;

/* ================= CONFIG ================= */
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'patmartinsbest@gmail.com';
const LS_KEY = 'bui_fund_deltas_v1';

/* ================= SEED DATA ================= */
const CAMPAIGNS: Campaign[] = [
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

/* ================= HELPERS ================= */
const money = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

function clampPct(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.min(100, Math.max(0, x));
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full bg-emerald-400 transition-all"
        style={{ width: `${clampPct(percent)}%` }}
      />
    </div>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex items-center">
      <span
        className="group inline-flex h-5 w-5 cursor-help select-none items-center justify-center rounded-full bg-white/10 text-[11px] text-white/80 border border-white/15"
      >
        ?
        {/* tooltip bubble */}
        <span
          className="pointer-events-none absolute left-1/2 top-0 z-20 hidden w-[260px] -translate-x-1/2 -translate-y-[110%] rounded-lg border border-white/15 bg-neutral-950 px-3 py-2 text-[11px] leading-snug text-white/90 shadow-xl group-hover:block"
        >
          {text}
          <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 rotate-45 border-r border-b border-white/15 bg-neutral-950" />
        </span>
      </span>
    </span>
  );
}
/* ================= PAGE ================= */
export default function FundPage() {
  // deltas (local demo)
  const [deltas, setDeltas] = useState<DeltaMap>({});
  const [loaded, setLoaded] = useState(false);

  // filters
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'All' | string>('All');

  // pledge modal
  const [pledgeOpen, setPledgeOpen] = useState(false);
  const [active, setActive] = useState<Campaign | null>(null);
  const [amount, setAmount] = useState(25);

  // info panel (bottom sheet)
  const [infoOpen, setInfoOpen] = useState(false);

  // contact form (demo)
  const [contactEmail, setContactEmail] = useState('');
  const [contactTopic, setContactTopic] = useState('Funding terms');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSent, setContactSent] = useState<string | null>(null);

  /* -------- Load local deltas once (SSR safe) -------- */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DeltaMap;
        if (parsed && typeof parsed === 'object') setDeltas(parsed);
      }
    } catch {
      // ignore bad JSON
    } finally {
      setLoaded(true);
    }
  }, []);

  /* -------- Persist deltas after load (prevents overwrite loop) -------- */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!loaded) return;

    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(deltas));
    } catch {
      // ignore
    }
  }, [deltas, loaded]);

  /* -------- Apply deltas -------- */
  const campaigns = useMemo(() => {
    return CAMPAIGNS.map((c) => {
      const d = deltas[c.id];
      if (!d) return c;
      return {
        ...c,
        raisedUsd: c.raisedUsd + (d.raisedDelta || 0),
        backers: c.backers + (d.backersDelta || 0),
      };
    });
  }, [deltas]);

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(campaigns.map((c) => c.category)))];
  }, [campaigns]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return campaigns.filter((c) => {
      const matchesCategory = category === 'All' || c.category === category;
      const matchesText =
        !q || (c.title + ' ' + c.blurb).toLowerCase().includes(q);
      return matchesCategory && matchesText;
    });
  }, [campaigns, category, query]);

  /* -------- Actions -------- */
  function openPledge(c: Campaign) {
    setActive(c);
    setAmount(25);
    setPledgeOpen(true);
  }

  function confirmPledge() {
    if (!active) return;
    if (!Number.isFinite(amount) || amount <= 0) return;

    setDeltas((prev) => {
      const curr = prev[active.id] || { raisedDelta: 0, backersDelta: 0 };
      return {
        ...prev,
        [active.id]: {
          raisedDelta: (curr.raisedDelta || 0) + amount,
          backersDelta: (curr.backersDelta || 0) + 1,
        },
      };
    });

    setPledgeOpen(false);
    alert(`🎉 Thanks! You pledged ${money(amount)} to “${active.title}”. (Saved locally)`);
  }

  function resetContactFeedback() {
    setContactSent(null);
  }

  function submitContact(e: React.FormEvent) {
    e.preventDefault();
    resetContactFeedback();

    const em = contactEmail.trim();
    const msg = contactMsg.trim();

    if (!em || !msg) {
      setContactSent('Please enter your email and message.');
      return;
    }

    // Demo only. Later you can POST to an API route that emails admin.
    setContactSent(`✅ Sent (demo). Admin will reply: ${ADMIN_EMAIL}`);
    setContactEmail('');
    setContactMsg('');
    setTimeout(() => setInfoOpen(false), 900);
  }

  /* ================= UI ================= */
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-white">
      {/* Header */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold">
          Fund{' '}
          <span className="bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent">
            Unique Ideas
          </span>
        </h1>

        <p className="mt-3 text-white/70 max-w-2xl mx-auto">
          Support promising innovations. Confidential details are protected by NDA.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm">
          <Link href="/" className="text-emerald-300 underline">
            ← Back Home
          </Link>

          <Link href="/legal/terms" className="text-white/70 underline hover:text-white">
            Funding Terms
          </Link>

          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="rounded-full bg-white text-black px-4 py-2 text-sm font-semibold hover:opacity-90"
            title="How the fund works + contact admin"
          >
            How it works / Contact
          </button>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-6xl mx-auto px-6 mt-6 flex flex-col md:flex-row gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search campaigns…"
          className="flex-1 rounded-xl bg-white/5 border border-white/15 px-4 py-2 outline-none focus:border-white/30"
        />

        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-xl px-3 py-2 text-xs border transition ${
                c === category
                  ? 'bg-white/15 border-white/40'
                  : 'bg-white/5 border-white/15 text-white/80 hover:bg-white/10'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Cards */}
      <section className="max-w-6xl mx-auto px-6 mt-6 grid sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
        {filtered.map((c) => {
          const percent = (c.raisedUsd / c.goalUsd) * 100;

          return (
            <article
              key={c.id}
              className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:border-emerald-400 transition"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Title */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2
                      className={`text-lg font-semibold ${
                        c.protected ? 'blur-[2px] select-none pointer-events-none' : ''
                      }`}
                      title={c.protected ? 'Confidential. Full details available after NDA.' : c.title}
                    >
                      {c.title}
                    </h2>

                    {/* Tooltip icon (only for protected campaigns) */}
                   {c.protected && (
  <Tip text="This campaign is protected.
   Request NDA by clicking on the above button: HOW IT WORKS/CONTACT for full details and terms." />
)}
                    
                  </div>

                  <p
                    className={`mt-2 text-sm text-white/80 ${
                      c.protected ? 'blur-sm select-none' : ''
                    }`}
                    title={
                      c.protected
                        ? 'Protected summary. Request NDA for full access.'
                        : c.blurb
                    }
                  >
                    {c.blurb}
                  </p>

                  {c.protected && (
                    <p className="mt-2 text-xs text-amber-300">
                      🔒 NDA required for full details <span className="text-white/40">(hover ?)</span>
                    </p>
                  )}
                </div>

                {/* Category badge */}
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/70">
                  {c.category}
                </span>
              </div>

              <div className="mt-5 space-y-2">
                <ProgressBar percent={percent} />
                <div className="flex justify-between text-sm text-white/80">
                  <span>
                    {money(c.raisedUsd)} / {money(c.goalUsd)}
                  </span>
                  <span>{c.backers} backers</span>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => openPledge(c)}
                  className="rounded-xl bg-white text-black px-3 py-2 font-semibold hover:opacity-90"
                >
                  Pledge
                </button>

                <Link
                  href="/fund/learn-more"
                  className="rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/15"
                >
                  Learn more
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      {/* Pledge Modal */}
      {pledgeOpen && active && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Pledge to “{active.title}”</h3>
                <p className="text-sm text-white/70 mt-1">
                  Demo only — pledge is stored locally to update progress.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPledgeOpen(false)}
                className="text-sm px-3 py-1 rounded bg-white/10 hover:bg-white/20"
              >
                ✕
              </button>
            </div>

            <label className="block mt-4 text-sm">
              Amount (USD)
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
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

      {/* Bottom Slide-up Panel: How it works / Contact */}
      {infoOpen && (
        <div className="fixed inset-0 z-40">
          {/* backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setInfoOpen(false)}
            aria-label="Close panel"
          />
          {/* panel */}
          <section className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-neutral-950">
            <div className="max-w-5xl mx-auto px-6 py-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-emerald-300">
                    How Funding Works
                  </h3>
                  <p className="mt-2 text-sm text-white/70 max-w-3xl">
                    We support early-stage innovations under clear legal and confidentiality frameworks.
                    Protected campaigns require NDA before full details are shared.
                  </p>
                </div>

                <button
                  onClick={() => setInfoOpen(false)}
                  className="text-sm px-3 py-1 rounded bg-white/10 hover:bg-white/20"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold text-white mb-2">📌 Funding Process</h4>
                  <ul className="space-y-1 text-white/80 list-disc list-inside">
                    <li>Campaigns shown are pre-screened concepts</li>
                    <li>Public summaries are limited for safety</li>
                    <li>Protected campaigns require NDA approval</li>
                    <li>Terms are negotiated directly with the admin</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">🔒 Essential Protocols</h4>
                  <ul className="space-y-2 text-white/80">
                    <li className="flex items-center justify-between gap-3">
                      <span>1) NDA workflow (request → sign → upload)</span>
                      <a
                        className="text-emerald-300 underline"
                        href="/investor/ideas"
                        onClick={() => setInfoOpen(false)}
                      >
                        Open
                      </a>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <span>2) Funding terms & process</span>
                      <Link
                        className="text-emerald-300 underline"
                        href="/legal/terms"
                        onClick={() => setInfoOpen(false)}
                      >
                        Open
                      </Link>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <span>3) Pitch / attachments guideline</span>
                      <Link
                        className="text-emerald-300 underline"
                        href="/fund/learn-more"
                        onClick={() => setInfoOpen(false)}
                      >
                        Open
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-4">
                <h4 className="font-semibold text-white mb-2">📬 Contact Admin</h4>
                <p className="text-xs text-white/60 mb-3">
                  Admin email: <span className="font-mono text-white/80">{ADMIN_EMAIL}</span>
                </p>

                <form onSubmit={submitContact} className="grid md:grid-cols-2 gap-3">
                  <input
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Your email"
                    className="rounded-md bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
                  />

                  <select
                    value={contactTopic}
                    onChange={(e) => setContactTopic(e.target.value)}
                    className="rounded-md bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
                  >
                    <option>Funding terms</option>
                    <option>Request NDA</option>
                    <option>Pitch deck guidelines</option>
                    <option>Protocol questions</option>
                    <option>Other inquiry</option>
                  </select>

                  <textarea
                    required
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    placeholder="Message to admin…"
                    className="md:col-span-2 rounded-md bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-white/30 min-h-[90px]"
                  />

                  {contactSent && (
                    <p className="md:col-span-2 text-sm text-emerald-300">
                      {contactSent}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="md:col-span-2 rounded-md bg-emerald-400 text-black px-4 py-2 font-semibold hover:bg-emerald-300"
                  >
                    Send message (demo)
                  </button>

                  <a
                    className="md:col-span-2 text-xs text-white/70 underline hover:text-white"
                    href={`mailto:${encodeURIComponent(ADMIN_EMAIL)}?subject=${encodeURIComponent(
                      'Funding Terms / NDA Request'
                    )}&body=${encodeURIComponent('Hello Admin, I would like to discuss funding terms and protocols…')}`}
                  >
                    Or click to email admin directly
                  </a>
                </form>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}