import './globals.css'
import { ReactNode } from 'react'

function Header() {
  return (
    <header className="site-header glass-card" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>Autonomous AI Creator</a>
          <nav className="site-nav" style={{ display: 'flex', gap: 8 }}>
            <a className="nav-link" href="/">Home</a>
            <a className="nav-link" href="/agents">Agents</a>
          </nav>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a className="secondary-btn" href="/">Docs</a>
          <a className="secondary-btn" href="/">Support</a>
        </div>
      </div>
    </header>
  )
}

export const metadata = {
  title: 'Autonomous AI Creator',
  description: 'Hackathon starter for Autonomous AI Creator',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
          <Header />
          {children}
        </main>
      </body>
    </html>
  )
}
