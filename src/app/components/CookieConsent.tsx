'use client'

import { useEffect, useState } from 'react'

type ConsentPrefs = {
  necessary: true
  analytics: boolean
  marketing: boolean
  timestamp: string
}

const COOKIE_NAME = 'cookie_consent'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180 // 180 days

function getCookie(name: string) {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`
}

function hasConsent(): ConsentPrefs | null {
  try {
    const v = getCookie(COOKIE_NAME) || (typeof window !== 'undefined' ? localStorage.getItem(COOKIE_NAME) : null)
    return v ? (JSON.parse(v) as ConsentPrefs) : null
  } catch {
    return null
  }
}

export default function CookieConsent() {
  const [show, setShow] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const existing = hasConsent()
    if (!existing) setShow(true)
  }, [])

  useEffect(() => {
  const open = () => setShowModal(true)
  window.addEventListener('open-cookie-settings', open)
  return () => window.removeEventListener('open-cookie-settings', open)
}, [])

  function savePrefs(a: boolean, m: boolean) {
    const prefs: ConsentPrefs = {
      necessary: true,
      analytics: a,
      marketing: m,
      timestamp: new Date().toISOString(),
    }
    const value = JSON.stringify(prefs)
    setCookie(COOKIE_NAME, value, COOKIE_MAX_AGE)
    try { localStorage.setItem(COOKIE_NAME, value) } catch {}
    setShow(false)
    setShowModal(false)
    // 🔻 OPTIONAL: call your analytics init/disable here depending on prefs
    if (prefs.analytics) {
      // initAnalytics() // your function that loads GA etc.
    } else {
      // disableAnalytics() // your function to turn it off
    }
  }

  function acceptAll() {
    savePrefs(true, true)
  }

  function rejectAll() {
    savePrefs(false, false)
  }

  function openCustomize() {
    setShowModal(true)
  }

  if (!show) return null

  return (
    <>
      {/* Banner */}
      <div className="fixed inset-x-0 bottom-0 z-40">
        <div className="mx-auto max-w-4xl rounded-t-xl border border-white/10 bg-black/80 backdrop-blur p-4 md:p-5 text-white/90 shadow-2xl">
          <div className="md:flex md:items-center md:justify-between gap-4">
            <div className="md:max-w-3xl">
              <p className="text-sm leading-6">
                We use cookies to run this site and improve your experience.{' '}
                <a href="/legal/cookies" className="text-emerald-300 hover:underline">Learn more</a>.
              </p>
            </div>
            <div className="mt-3 md:mt-0 flex gap-2">
              <button
                onClick={openCustomize}
                className="px-3 py-2 rounded-md border border-white/20 bg-white/5 hover:bg-white/10 text-sm"
              >
                Customize
              </button>
              <button
                onClick={rejectAll}
                className="px-3 py-2 rounded-md border border-white/20 bg-white/5 hover:bg-white/10 text-sm"
              >
                Reject
              </button>
              <button
                onClick={acceptAll}
                className="px-3 py-2 rounded-md bg-emerald-500 text-black font-semibold hover:bg-emerald-400 text-sm"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <div className="relative w-[92%] max-w-lg rounded-xl border border-white/10 bg-[#0b1120] p-5 text-white shadow-2xl">
            <h3 className="text-lg font-semibold text-emerald-300">Cookie Preferences</h3>
            <p className="text-white/70 text-sm mt-1">
              Choose which cookies to allow. Necessary cookies are always on to keep the site working.
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-white/10 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Necessary</p>
                    <p className="text-white/60 text-sm">Required for login, security, and basic functionality.</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-white/10 border border-white/10">Always on</span>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Analytics</p>
                    <p className="text-white/60 text-sm">Helps us understand usage to improve the platform.</p>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                    />
                    <span className="text-sm">{analytics ? 'On' : 'Off'}</span>
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing</p>
                    <p className="text-white/60 text-sm">Personalized content and remarketing (if enabled).</p>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={marketing}
                      onChange={(e) => setMarketing(e.target.checked)}
                    />
                    <span className="text-sm">{marketing ? 'On' : 'Off'}</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-2 rounded-md border border-white/20 bg-white/5 hover:bg-white/10 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => savePrefs(analytics, marketing)}
                className="px-3 py-2 rounded-md bg-emerald-500 text-black font-semibold hover:bg-emerald-400 text-sm"
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
