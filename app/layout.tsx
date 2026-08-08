import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Autonomous AI Creator',
  description: 'Hackathon starter for Autonomous AI Creator',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>{children}</main>
      </body>
    </html>
  )
}
