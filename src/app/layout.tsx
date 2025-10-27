import './globals.css'

export const metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'BANK OF UNIQUE-IDEAS'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-b from-neutral-950 to-neutral-900 text-white antialiased">
        {children}
      </body>
    </html>
  )
}
