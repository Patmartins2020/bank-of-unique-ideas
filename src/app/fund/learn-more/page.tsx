import Link from 'next/link';

export default function FundLearnMorePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white px-6 pt-24 pb-10">
      <div className="max-w-3xl mx-auto rounded-2xl border border-white/10 bg-black/40 p-6 md:p-10 shadow-lg shadow-black/40">
        <h1 className="text-3xl font-extrabold text-emerald-300 mb-3">
          Learn More About Funding
        </h1>

        <p className="text-white/75 leading-7">
          The <strong>Bank of Unique Ideas</strong> is built to protect inventors, help investors
          discover high-potential concepts, and create a structured review process that turns ideas
          into real-world solutions.
        </p>

        <div className="mt-6 space-y-4 text-white/75 leading-7">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-semibold text-white mb-1">What your support helps us do</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Maintain secure infrastructure and storage</li>
              <li>Improve inventor protection & NDA workflows</li>
              <li>Build investor discovery and matching tools</li>
              <li>Support product development and new features</li>
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-semibold text-white mb-1">Transparency</h2>
            <p>
              We aim to keep funding simple and transparent — contributions are used to strengthen
              the platform and improve its ability to protect and grow real innovations.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/fund"
            className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
          >
            ← Back to Fund page
          </Link>

          <Link
            href="/"
            className="rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}