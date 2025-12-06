'use client';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-neutral-950/95 text-white">
      <div className="mx-auto max-w-6xl px-4 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-xs text-white/70">
            © {new Date().getFullYear()}{" "}
            <a href="/" className="text-emerald-300 hover:text-emerald-200">
              Bank of Unique Ideas
            </a>. All rights reserved.
          </p>

          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <a href="/legal/terms" className="text-white/70 hover:text-white">Terms</a>
            <a href="/legal/privacy" className="text-white/70 hover:text-white">Privacy</a>
            <a href="/legal/refunds" className="text-white/70 hover:text-white">Refunds</a>
            <a href="/legal/cookies" className="text-white/70 hover:text-white">Cookies</a>
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent('open-cookie-settings'))
              }
              className="text-white/70 hover:text-white underline"
            >
              Cookie settings
            </button>
            <a href="mailto:support@bankofuniqueideas.com" className="text-white/70 hover:text-white">
              support@bankofuniqueideas.com
            </a>
            <div className="hidden md:flex items-center gap-3 ml-2">
              <a aria-label="Facebook" href="#" className="text-white/60 hover:text-white">𝕗</a>
              <a aria-label="X/Twitter" href="#" className="text-white/60 hover:text-white">𝕏</a>
              <a aria-label="LinkedIn" href="#" className="text-white/60 hover:text-white">in</a>
              <a aria-label="YouTube" href="#" className="text-white/60 hover:text-white">▶</a>
            </div>
          </nav>
        </div>

        <div className="mt-3 text-center">
          <a href="#top" className="text-[11px] text-white/60 hover:text-white">
            ↑ Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
