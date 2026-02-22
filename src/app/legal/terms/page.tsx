export const metadata = { title: 'Terms of Service — Bank of Unique Ideas' }

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0b1120] text-white">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="text-2xl font-bold text-emerald-400">Terms of Service</h1>
          <p className="text-white/60 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-8 leading-relaxed text-white/90 space-y-6">
        <p>
          These Terms govern your use of <strong>Bank of Unique Ideas</strong> (“Platform”, “we”, “us”). By accessing or
          using the Platform, you agree to these Terms.
        </p>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">1) Accounts & Eligibility</h2>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>You must be 18+ or have legal guardian consent.</li>
            <li>You are responsible for your account, credentials, and all activity under it.</li>
            <li>We may suspend/terminate accounts for violations of these Terms or applicable laws.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">2) Submissions & Ownership</h2>
          <p className="mt-2">
            You retain ownership of your ideas. By submitting, you grant us a non-exclusive, worldwide license to host,
            process, and display your content according to the visibility settings you choose (public/blurred/private),
            solely to operate and promote the Platform. We do not file IP on your behalf unless separately agreed in
            writing.
          </p>
          <p className="mt-2 text-white/80">
            You are responsible for ensuring your submission does not infringe third-party rights and complies with law.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">3) Confidentiality Controls</h2>
          <p className="mt-2">
            We provide tools to blur or restrict fields and may require NDAs for deeper disclosures. While we take
            reasonable steps to protect confidentiality, no internet platform can guarantee absolute secrecy. Share only
            what you’re comfortable sharing based on your chosen settings.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">4) Idea Deposit ($1.99) & Refunds</h2>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><strong>Deposit:</strong> A small <em>idea deposit</em> (e.g., $1.99) helps cover review handling and timestamping.</li>
            <li><strong>Refund:</strong> Fully refundable if your idea is <em>not confirmed</em> after review.</li>
            <li>No equity, exclusivity, or revenue rights are created by paying a deposit.</li>
            <li>Refunds are issued to the original payment method and timing depends on your payment provider.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">5) Prohibited Uses</h2>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>Illegal, harmful, defamatory, or infringing content.</li>
            <li>Malware, scraping, reverse engineering beyond lawful limits, or service disruption.</li>
            <li>Misrepresenting ownership or submitting pirated/copied ideas.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">6) Disclaimers & Liability Limits</h2>
          <p className="mt-2">
            The Platform is provided “as is” without warranties. To the fullest extent permitted by law, we disclaim all
            implied warranties and are not liable for indirect, incidental, special, or consequential damages, or lost
            profits/data. Your sole remedy is to stop using the Platform and, where applicable, request a refund under
            Section 4.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">7) Changes</h2>
          <p className="mt-2">We may update these Terms. Continued use after changes means you accept the updated Terms.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">8) Contact</h2>
          <p className="mt-2">
            Questions? Email <span className="text-emerald-300">support@bankofuniqueideas.com</span>
          </p>
        </div>
      </section>
    </main>
  )
}
