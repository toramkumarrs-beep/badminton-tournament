import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shuttle Court — Badminton Tournament Manager',
  description: 'Create and manage Knockout and League badminton tournaments. Generate brackets, track scores, and share results.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground selection:bg-primary/20 selection:text-primary" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>

        {/* Ambient Stadium Glows */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-primary/10 rounded-full blur-[140px]" />
          <div className="absolute top-1/4 -left-48 w-96 h-96 bg-secondary/10 rounded-full blur-[110px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[130px]" />
        </div>

        {children}
      </body>
    </html>
  )
}
