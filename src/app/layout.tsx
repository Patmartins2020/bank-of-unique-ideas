// app/layout.tsx
import './globals.css'
import Navbar from './components/Navbar'
import CookieConsent from './components/CookieConsent'
import Footer from './components/Footer'

export const metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'BANK OF UNIQUE-IDEAS',
  description: 'A platform for protecting and growing your unique ideas',

  // PWA + App icons
  manifest: '/manifest.json',
  themeColor: '#0b1220',

  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/icon-192.png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-b from-neutral-950 to-neutral-900 text-white antialiased">
        <Navbar />
        {children}
        <CookieConsent />
        <Footer />
      </body>
    </html>
  )
}
