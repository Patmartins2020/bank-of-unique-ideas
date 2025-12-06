'use client'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function readConsent() {
  try {
    const fromCookie =
      typeof document !== 'undefined'
        ? document.cookie.match(/(?:^|; )cookie_consent=([^;]+)/)?.[1]
        : null
    const raw = fromCookie ? decodeURIComponent(fromCookie)
      : (typeof window !== 'undefined' ? localStorage.getItem('cookie_consent') : null)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export default function AnalyticsGate() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Load analytics once (if consented)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const dnt = (navigator as any).doNotTrack === '1' || (window as any).doNotTrack === '1'
    if (dnt) return

    const prefs = readConsent()
    if (!prefs?.analytics) return

    // ---- Google Analytics (gtag) example ----
    const GA_ID = process.env.NEXT_PUBLIC_GA_ID // e.g. G-XXXXXXX
    if (!GA_ID) return
    const s1 = document.createElement('script')
    s1.async = true
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
    document.head.appendChild(s1)

    const s2 = document.createElement('script')
    s2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){ dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', '${GA_ID}', { anonymize_ip: true });
    `
    document.head.appendChild(s2)
  }, [])

  // Track client-side route changes (GA)
  useEffect(() => {
    const GA_ID = process.env.NEXT_PUBLIC_GA_ID
    const prefs = readConsent()
    if (!GA_ID || !prefs?.analytics) return
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    // @ts-ignore
    if (typeof window !== 'undefined' && window.gtag) window.gtag('event', 'page_view', { page_path: url })
  }, [pathname, searchParams])

  return null
}
