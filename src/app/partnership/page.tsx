'use client';

import { useMemo, useState } from 'react';

const ORG_TYPES = [
  'University / College',
  'Innovation Hub / Incubator',
  'Accelerator / Venture Network',
  'Law Firm / IP Consultant',
  'Technology Provider',
  'Government / Agency',
  'NGO / Community',
  'Other',
];

const PARTNERSHIP_TYPES = [
  'Institutional Partnership',
  'Technology Partnership',
  'Legal & IP Partnership',
  'Innovation Ecosystem Partnership',
  'Other',
];

export default function PartnershipPage() {
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('');
  const [partnershipType, setPartnershipType] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [country, setCountry] = useState('');
  const [website, setWebsite] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'err' | 'warn'; text: string } | null>(null);

  const canSubmit = useMemo(() => {
    return (
      orgName.trim() &&
      orgType.trim() &&
      partnershipType.trim() &&
      contactName.trim() &&
      contactEmail.trim()
    );
  }, [orgName, orgType, partnershipType, contactName, contactEmail]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setStatus(null);

    if (!canSubmit) {
      setStatus({ kind: 'warn', text: 'Please fill all required fields.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/partner-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName,
          orgType,
          partnershipType,
          contactName,
          contactEmail,
          contactPhone,
          country,
          website,
          message,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to submit request.');
      }

      setStatus({ kind: 'ok', text: '✅ Submitted successfully. We will contact you shortly.' });

      // Reset
      setOrgName('');
      setOrgType('');
      setPartnershipType('');
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setCountry('');
      setWebsite('');
      setMessage('');
    } catch (err: any) {
      setStatus({ kind: 'err', text: err?.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  }

  const statusClass =
    status?.kind === 'ok'
      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
      : status?.kind === 'warn'
      ? 'border-amber-400/30 bg-amber-500/10 text-amber-200'
      : 'border-rose-400/30 bg-rose-500/10 text-rose-200';

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white px-6 pt-24 pb-12">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* HERO */}
        <section className="grid lg:grid-cols-2 gap-6 items-stretch">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-7 shadow-lg shadow-black/30">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-extrabold tracking-wide uppercase">
              Partnership
            </div>

            <h1 className="mt-4 text-4xl font-extrabold text-emerald-300 leading-tight">
              Partner With Global Bank Of Unique Ideas (GlobUI)
            </h1>

            <p className="mt-3 text-white/70">
              Help build trusted infrastructure for documenting innovation. GlobUI collaborates with universities,
              innovation hubs, legal/IP professionals, and technology providers to strengthen inventor confidence and impact.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href="#apply"
                className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-black hover:bg-emerald-300 transition"
              >
                Apply for Partnership
              </a>
              <a
                href="#types"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
              >
                Explore Partnership Types
              </a>
            </div>

            <p className="mt-4 text-xs text-white/55">
              GlobUI provides proof-of-existence and authorship records (hash + timestamp + certificate). It does not replace patents.
            </p>
          </div>

          {/* WHY PARTNER */}
          <aside className="rounded-3xl border border-white/10 bg-black/30 p-7 shadow-lg shadow-black/30">
            <h3 className="text-lg font-extrabold">Why partner with us</h3>

            <div className="mt-4 grid gap-3">
              {[
                {
                  title: 'Trust infrastructure',
                  desc: 'Independent timestamping + verification makes records credible.',
                },
                {
                  title: 'Institution-ready',
                  desc: 'Great fit for student innovation programs and incubators.',
                },
                {
                  title: 'Real-world impact',
                  desc: 'Empowers inventors before patents, pitching, and commercialization.',
                },
              ].map((x) => (
                <div
                  key={x.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="font-bold text-white/95">{x.title}</div>
                  <div className="mt-1 text-sm text-white/65">{x.desc}</div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        {/* WHY */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold">Why Partner With GlobUI</h2>
            <p className="text-white/65 max-w-2xl">
              Partnerships help expand access, credibility, and adoption across innovation ecosystems.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: 'Strengthen inventor confidence',
                desc: 'Provide a low-cost first step for inventors to record proof-of-existence and authorship before disclosure.',
                tags: ['Confidence', 'Access'],
              },
              {
                title: 'Reduce disputes and confusion',
                desc: 'Clear records help reduce “who had it first” conflicts in student projects, incubators, and collaborations.',
                tags: ['Clarity', 'Governance'],
              },
              {
                title: 'Support innovation programs',
                desc: 'Complement competitions, capstone projects, and entrepreneurship tracks with structured evidence records.',
                tags: ['Universities', 'Hubs'],
              },
              {
                title: 'Build global innovation infrastructure',
                desc: 'Become a trusted reference point for idea identity, verification, and responsible innovation.',
                tags: ['Scale', 'Impact'],
              },
            ].map((c) => (
              <div key={c.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="font-extrabold">{c.title}</h3>
                <p className="mt-2 text-sm text-white/65">{c.desc}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[12px] rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/70 font-semibold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TYPES */}
        <section id="types" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold">Partnership Types</h2>
            <p className="text-white/65 max-w-2xl">
              Choose the category that fits your organization. We’ll tailor the collaboration model.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: 'Institutional Partnerships',
                desc: 'Universities, colleges, research institutes, and innovation hubs supporting student and inventor deposits.',
                tags: ['Student programs', 'Institution dashboard', 'Innovation tracking'],
              },
              {
                title: 'Technology Partnerships',
                desc: 'Timestamp providers, cybersecurity teams, cloud partners, and verification infrastructure collaborators.',
                tags: ['Timestamping', 'Security', 'Integrations'],
              },
              {
                title: 'Legal & IP Partnerships',
                desc: 'Patent attorneys and IP consultants supporting inventors from deposit to proper protection pathways.',
                tags: ['IP guidance', 'Referrals', 'Education'],
              },
              {
                title: 'Innovation Ecosystem Partnerships',
                desc: 'Accelerators, venture networks, entrepreneurship communities, and competitions needing clear submission records.',
                tags: ['Accelerators', 'Competitions', 'Incubators'],
              },
            ].map((c) => (
              <div key={c.title} className="rounded-3xl border border-white/10 bg-black/30 p-6">
                <h3 className="font-extrabold">{c.title}</h3>
                <p className="mt-2 text-sm text-white/65">{c.desc}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[12px] rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/70 font-semibold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            <div className="md:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-extrabold">Our Collaboration Vision</h3>
              <p className="mt-2 text-sm text-white/65">
                GlobUI aims to be a trusted global reference for documenting ideas and innovation records.
                Partnerships help broaden access, improve technical credibility, and strengthen the culture of responsible innovation.
              </p>
            </div>
          </div>
        </section>

        {/* APPLY */}
        <section id="apply" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold">Apply for Partnership</h2>
            <p className="text-white/65 max-w-2xl">
              Submit your request. We’ll review and respond with next steps for collaboration.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
            <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-4">
              {/* Org */}
              <div>
                <label className="text-xs font-bold text-white/80">Organization name *</label>
                <input
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g., University of ..."
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white/80">Organization type *</label>
                <select
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select one
                  </option>
                  {ORG_TYPES.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              {/* Partnership type */}
              <div>
                <label className="text-xs font-bold text-white/80">Partnership type *</label>
                <select
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  value={partnershipType}
                  onChange={(e) => setPartnershipType(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select one
                  </option>
                  {PARTNERSHIP_TYPES.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact */}
              <div>
                <label className="text-xs font-bold text-white/80">Contact name *</label>
                <input
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white/80">Contact email *</label>
                <input
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@organization.com"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white/80">Phone (optional)</label>
                <input
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 ..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white/80">Country (optional)</label>
                <input
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="USA, Italy, UK..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white/80">Website (optional)</label>
                <input
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-white/80">Message (optional)</label>
                <textarea
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-emerald-400 min-h-[120px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you want to achieve with GlobUI..."
                />
              </div>

              <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-extrabold text-black hover:bg-emerald-300 transition disabled:opacity-60"
                >
                  {loading ? 'Submitting…' : 'Submit partnership request'}
                </button>

                {status && (
                  <div className={`rounded-xl border px-4 py-2 text-sm ${statusClass}`}>
                    {status.text}
                  </div>
                )}
              </div>
            </form>
          </div>
        </section>

        {/* FOOTER LINKS */}
        <section className="pt-2">
          <div className="text-center text-xs text-white/55">
            <div>Do you already have an account? <a className="text-emerald-300 underline font-semibold" href="/login">Log in here</a></div>
            <div className="mt-1">Are you an Inventor or Investor? <a className="text-emerald-300 underline font-semibold" href="/signup">Sign up here</a></div>

            <div className="mt-4">
              <a className="underline hover:text-white/70" href="/legal/terms">
                Terms & Confidentiality
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}