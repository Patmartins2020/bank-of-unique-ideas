export const metadata = { title: 'Cookies & Data — Bank of Unique Ideas' }

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-[#0b1120] text-white">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="text-2xl font-bold text-emerald-400">Cookies & Data Processing</h1>
          <p className="text-white/60 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-8 leading-relaxed text-white/90 space-y-6">
        <p>
          This page explains how <strong>Bank of Unique Ideas</strong> uses cookies and how we process data with our
          service providers (processors). For full details, also see our{' '}
          <a className="text-emerald-300 hover:underline" href="/legal/privacy">Privacy Policy</a>.
        </p>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">1) What Are Cookies?</h2>
          <p className="mt-2">
            Cookies are small text files stored on your device to help websites function, remember preferences, and
            improve performance and security. Similar technologies include local storage and pixels.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">2) Types of Cookies We Use</h2>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><strong>Strictly Necessary:</strong> required for core features like login and session management.</li>
            <li><strong>Performance/Analytics (optional):</strong> help us understand usage and improve the Platform.</li>
            <li><strong>Functional:</strong> remember choices (e.g., language, theme).</li>
            <li><strong>Marketing (optional):</strong> only used with consent if we enable ad/remarketing tools.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">3) Managing Cookies</h2>
          <p className="mt-2">
            On your first visit (and periodically), we may present a cookie consent banner. You can accept all, reject
            non-essential, or customize settings. You may also manage cookies in your browser settings. Disabling
            essential cookies may break core functionality (e.g., sign-in).
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">4) Processors & International Transfers</h2>
          <p className="mt-2">
            We use reputable providers for hosting, storage, authentication, email, payments, and analytics. These
            providers process data on our behalf under contracts that include confidentiality and security obligations.
            Data may be transferred internationally with appropriate safeguards (e.g., SCCs).
          </p>
          <p className="mt-2 text-white/80 text-sm">
            Example categories: cloud hosting, object storage, auth, email delivery, payment gateways, analytics.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">5) Your Rights (GDPR/CCPA)</h2>
          <p className="mt-2">
            Depending on your location, you may have rights to access, delete, correct, restrict, object, or opt out of
            sale/share (we do not sell). To exercise rights, contact us at{' '}
            <span className="text-emerald-300">support@bankofuniqueideas.com</span>.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-emerald-300">6) Updates</h2>
          <p className="mt-2">
            We may update this page as our Platform or legal requirements evolve. Continued use indicates acceptance.
          </p>
        </div>
      </section>
    </main>
  )
}
