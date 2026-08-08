"use client"
import React, { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark'
    try {
      const s = localStorage.getItem('theme')
      if (s === 'light' || s === 'dark') return s
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    } catch (e) {
      return 'dark'
    }
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    try { localStorage.setItem('theme', theme) } catch (e) {}
  }, [theme])

  function toggle() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  return (
    <button aria-label="Toggle theme" className="theme-toggle" onClick={toggle}>
      {theme === 'dark' ? (
        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>🌙 Dark</span>
      ) : (
        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>☀️ Light</span>
      )}
    </button>
  )
}
