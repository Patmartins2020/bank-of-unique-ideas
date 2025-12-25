// src/app/legal/nda/page.tsx

export default function NdaPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-white px-6 pt-24 pb-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
            Bank of Unique Ideas
          </p>
          <h1 className="text-3xl font-extrabold text-emerald-300">
            Mutual Non-Disclosure Agreement (Summary)
          </h1>
          <p className="text-sm text-white/70">
            This page summarises the key terms of the NDA that applies when an
            investor requests access to a protected idea on the Bank of Unique Ideas
            platform.
          </p>
        </header>

        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold text-emerald-300">
            1. Parties
          </h2>
          <p>
            This agreement is between the <strong>Inventor</strong> who submits a
            protected idea to the Bank of Unique Ideas, the <strong>Investor</strong>{' '}
            requesting access to that idea, and <strong>Bank of Unique Ideas</strong>{' '}
            as platform facilitator.
          </p>

          <h2 className="mt-4 text-lg font-semibold text-emerald-300">
            2. Confidential Information
          </h2>
          <p>
            “Confidential Information” includes all non-public information about the
            inventor&apos;s idea, including concepts, designs, documents, media,
            business plans, technical details, and any related discussions made
            through the platform.
          </p>

          <h2 className="mt-4 text-lg font-semibold text-emerald-300">
            3. Purpose of Disclosure
          </h2>
          <p>
            Information is disclosed solely so the investor can evaluate a possible
            investment, collaboration, or licensing arrangement. It may not be used
            to copy, compete with, or exploit the idea without a written agreement
            with the inventor.
          </p>

          <h2 className="mt-4 text-lg font-semibold text-emerald-300">
            4. Investor Obligations
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Keep all confidential information strictly secret.</li>
            <li>
              Do not share it with anyone except internal team members or advisers
              who need to know and are bound by similar confidentiality duties.
            </li>
            <li>
              Do not file patents, launch products, or approach third parties using
              the confidential information without written permission from the
              inventor.
            </li>
            <li>
              Use at least reasonable commercial care to protect the information
              from unauthorised access or disclosure.
            </li>
          </ul>

          <h2 className="mt-4 text-lg font-semibold text-emerald-300">
            5. No Transfer of IP Ownership
          </h2>
          <p>
            This NDA does <strong>not</strong> transfer any intellectual property
            rights. The inventor retains full ownership of their ideas and related
            IP unless both parties later sign a separate written contract.
          </p>

          <h2 className="mt-4 text-lg font-semibold text-emerald-300">
            6. Duration
          </h2>
          <p>
            Confidentiality obligations continue for at least{' '}
            <strong>5 years</strong> from the date of disclosure, or longer where
            required by law or a separate written agreement.
          </p>

          <h2 className="mt-4 text-lg font-semibold text-emerald-300">
            7. Exceptions
          </h2>
          <p>
            Obligations do not apply to information that is already public (through
            no fault of the investor), already known to the investor on a lawful
            basis, independently developed without using the confidential
            information, or disclosed under legal compulsion (with prior notice to
            the inventor where possible).
          </p>

          <h2 className="mt-4 text-lg font-semibold text-emerald-300">
            8. Governing Law
          </h2>
          <p>
            The governing law and jurisdiction can be further specified in a
            detailed NDA or investment agreement between the inventor and investor.
          </p>

          <p className="mt-4 text-xs text-white/60">
            <strong>Note:</strong> This is a high-level summary for platform
            purposes and does not replace formal legal advice. For serious
            negotiations, the parties should sign a full legal NDA drafted or
            reviewed by a qualified lawyer.
          </p>
        </section>

        <div className="flex flex-wrap justify-between gap-3 text-xs text-white/70">
          <p>
            Returning investor? You can continue browsing ideas from your{' '}
            <a href="/investor" className="text-emerald-300 underline">
              investor dashboard
            </a>
            .
          </p>
          <p>
            Back to{' '}
            <a href="/" className="text-emerald-300 underline">
              home
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}