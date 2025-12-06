// app/layout.tsx
import './globals.css'
import Navbar from './components/Navbar'
import CookieConsent from './components/CookieConsent'
import Footer from './components/Footer'

export const metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'BANK OF UNIQUE-IDEAS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-b from-neutral-950 to-neutral-900 text-white antialiased">
        <Navbar />
        {children}
        {/* Shows only if user hasn’t made a choice yet */}
        <CookieConsent />
        {/* Always visible site-wide */}
        <Footer />
      </body>
    </html>
  )
}

