import './globals.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CookieConsent from './components/CookieConsent'
import IdeaAssistant from './components/IdeaAssistant'
import ClientTicker from './components/ClientTicker'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>

        <Navbar />

        {children}

        <Footer />
        <CookieConsent />

        <IdeaAssistant />
        <ClientTicker />

      </body>
    </html>
  )
}