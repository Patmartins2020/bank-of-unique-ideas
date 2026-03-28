import './globals.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CookieConsent from './components/CookieConsent'
import IdeaAssistant from './components/IdeaAssistant'
import ClientTicker from './components/ClientTicker'
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';

export const metadata = {
  title: "BANK OF UNIQUE IDEAS",
  description: "A platform for protecting and showcasing ideas",
  icons: {
    icon: "/favicon.ico",
    apple: '/icon-192.png'
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