export const metadata = { title: 'Refund Policy — Bank of Unique Ideas' };

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-[#0b1120] text-white">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="text-2xl font-bold text-emerald-400">Refund Policy</h1>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-8 leading-relaxed text-white/90">
        <p className="text-sm text-white/60 mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <h2 className="text-lg font-semibold text-emerald-300">
          Idea Deposit ($1.99)
        </h2>
        <p className="mt-2">
          Your idea deposit helps cover review handling and provides a timestamp
          record of your submission. It is <strong>fully refundable</strong> if
          your idea is <strong>not approved</strong>.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-emerald-300">
          Refund Windows
        </h2>
        <ul className="list-disc pl-5 mt-2 space-y-2">
          <li>
            If the idea is rejected after review, we will issue a full refund to
            the original payment method.
          </li>
          <li>
            If you withdraw your idea before review begins, contact support; we
            will make a good-faith effort to refund.
          </li>
        </ul>

        <h2 className="mt-6 text-lg font-semibold text-emerald-300">
          How to Request
        </h2>
        <p className="mt-2">
          Email{' '}
          <span className="text-emerald-300">
            billing@bankofuniqueideas.com
          </span>{' '}
          with your account email and idea title/ID. Refund processing time
          depends on your payment provider.
        </p>
      </section>
    </main>
  );
}
