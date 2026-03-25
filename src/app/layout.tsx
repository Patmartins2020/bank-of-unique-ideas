import './globals.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CookieConsent from './components/CookieConsent'
import IdeaAssistant from './components/IdeaAssistant'
import ClientTicker from './components/ClientTicker'

export const metadata = {
  title: "BANK OF UNIQUE IDEAS",
  description: "A platform for protecting and showcasing ideas",
  icons: {
    icon: "/favicon.ico",
  },
};

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