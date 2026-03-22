// app/layout.tsx
import './globals.css'
import Navbar from './components/Navbar'
import CookieConsent from './components/CookieConsent'
import Footer from './components/Footer'
import LiveTicker from './components/LiveTicker'

export const metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'BANK OF UNIQUE-IDEAS',
  description: 'A platform for protecting and growing your unique ideas',

  manifest: '/manifest.json',

  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/icon-192.png' }],
  },
}

// ✅ FIX: Next.js now prefers viewport export for themeColor
export const viewport = {
  themeColor: '#0b1220',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-b from-neutral-950 to-neutral-900 text-white antialiased">

        <Navbar />

        <main>
          {children}
        </main>

        <Footer />
        <CookieConsent />

        {/* ✅ GLOBAL LIVE TICKER */}
        <LiveTicker />

      </body>
    </html>
  )
}