export const metadata = { title: 'Privacy Policy — Bank of Unique Ideas' }

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0b1120] text-white">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="text-2xl font-bold text-emerald-400">Privacy Policy</h1>
          <p className="text-white/60 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-8 leading-relaxed text-white/90 space-y-6">
        <p>
          This Privacy Policy explains how <strong>Bank of Unique Ideas</strong> (“we”, “us”, the “Platform”)
          collects, uses, and protects your information when you use our services globally. By using the Platform, you
          agree to this Policy.
        </p>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">1) Data We Collect</h2>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><strong>Account & Profile:</strong> name, email, password hash, role (inventor/investor), areas of interest, country.</li>
            <li><strong>Idea Data:</strong> titles, categories, blurred/private fields, attached assets (images/videos/PDFs), review status, timestamps.</li>
            <li><strong>Transactional Data:</strong> idea deposit status, refund status, receipt references (via payment provider).</li>
            <li><strong>Technical Data:</strong> device info, IP address, logs, session cookies, analytics events (if enabled).</li>
            <li><strong>Communications:</strong> inquiries, support messages, NDA requests.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">2) How We Use Data</h2>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>Provide and secure accounts, submissions, review workflows, approvals, and NDA flows.</li>
            <li>Store assets and control visibility (public/blurred/private) per your settings.</li>
            <li>Process idea deposits and eligible refunds.</li>
            <li>Improve the Platform, prevent abuse/fraud, and comply with laws.</li>
            <li>Send service messages (e.g., submission status, security alerts). Marketing emails only with consent.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">3) Legal Bases (GDPR)</h2>
          <p className="mt-2">
            For users in the EEA/UK, we rely on: <em>contract necessity</em> (operate your account/submissions),
            <em> legitimate interests</em> (security, product improvement), <em>legal obligations</em>, and
            <em> consent</em> (where required, e.g., marketing cookies).
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">4) Sharing & Processors</h2>
          <p className="mt-2">
            We may share data with vetted processors strictly to run the Platform (hosting, storage, email, payments,
            analytics). Typical categories include: cloud hosting, object storage, email delivery, analytics, payment
            gateways, and customer support tools. We do not sell personal data.
          </p>
          <p className="mt-2 text-white/70 text-sm">
            Cross-border transfers may occur; where required, we use appropriate safeguards (e.g., SCCs).
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">5) Security & Retention</h2>
          <p className="mt-2">
            We employ access controls, encrypted transport (HTTPS), and role-based policies. No online service is 100%
            secure—share only what you’re comfortable sharing. We retain data only as long as needed for the purposes
            above or as required by law, then delete or anonymize it.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">6) Your Rights</h2>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><strong>GDPR/EEA/UK:</strong> access, correct, delete, restrict, portability, object, withdraw consent.</li>
            <li><strong>CCPA/CPRA (California):</strong> know, delete, correct, opt-out of sale/share (we do not sell), non-discrimination.</li>
          </ul>
          <p className="mt-2">To exercise rights, email <span className="text-emerald-300">support@bankofuniqueideas.com</span>.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">7) Children</h2>
          <p className="mt-2">
            The Platform is not intended for children under 13 (or the minimum age in your jurisdiction) without verified
            parental consent.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">8) Changes</h2>
          <p className="mt-2">We may update this Policy; continued use means you accept the latest version.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">9) Contact</h2>
          <p className="mt-2">
            Email: <span className="text-emerald-300">support@bankofuniqueideas.com</span>
          </p>
        </div>
      </section>
    </main>
  )
}
