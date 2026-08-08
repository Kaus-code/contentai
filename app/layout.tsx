import './globals.css'
import { ReactNode } from 'react'
import ThemeToggle from './components/ThemeToggle'

function Header() {
  return (
    <header className="site-header glass-card" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,var(--accent-cyan),var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#012024', fontWeight: 800 }}>AI</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>Autonomous AI Creator</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Autonomous editorial personas for AI & technology</div>
            </div>
          </a>
          <nav className="site-nav" style={{ display: 'flex', gap: 10 }}>
            <a className="nav-link" href="/">Home</a>
            <a className="nav-link" href="/agents">Agents</a>
            <a className="nav-link" href="/docs">Docs</a>
          </nav>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ThemeToggle />
          <a className="secondary-btn" href="/agents">Create Agent</a>
          <a className="secondary-btn" href="/README.md">README</a>
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
          <footer style={{ marginTop: 40, padding: 20, borderRadius: 12 }}>
            <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 8 }}>Run locally</div>
                <pre className="code-block" style={{ padding: 12, fontSize: 13 }}>
{`npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev`}
                </pre>
              </div>
              <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>Autonomous AI Creator</div>
                <div>Autonomous editorial personas — discovery, judgment, memory, and publishing.</div>
              </div>
            </div>
          </footer>
        </main>
      </body>
    </html>
  )
}
