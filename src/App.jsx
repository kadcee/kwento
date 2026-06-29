import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import CaptureScreen from './components/CaptureScreen'
import SummariesScreen from './components/SummariesScreen'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('today')
  const [lightMode, setLightMode] = useState(() => {
    return localStorage.getItem('kwento-theme') === 'light'
  })

  useEffect(() => {
    if (lightMode) {
      document.documentElement.classList.add('light')
      localStorage.setItem('kwento-theme', 'light')
    } else {
      document.documentElement.classList.remove('light')
      localStorage.setItem('kwento-theme', 'dark')
    }
  }, [lightMode])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 32 }}>◆</div>
      </div>
    )
  }

  if (!session) return <Auth />

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'today' ? (
          <CaptureScreen userId={session.user.id} />
        ) : (
          <SummariesScreen userId={session.user.id} />
        )}
      </div>

      <nav style={{
        display: 'flex',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        {[
          { id: 'today', emoji: '◆', label: 'Today' },
          { id: 'summaries', emoji: '◇', label: 'Summaries' },
        ].map(({ id, emoji, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, padding: '12px 0',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              fontSize: 11, fontWeight: 500,
              color: tab === id ? 'var(--accent)' : 'var(--text-muted)',
              background: 'none', border: 'none', cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: 18 }}>{emoji}</span>
            {label}
          </button>
        ))}

        <button
          onClick={() => setLightMode(prev => !prev)}
          style={{
            width: 56, padding: '12px 0',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 500,
            color: 'var(--text-muted)',
            background: 'none', border: 'none', cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: 18 }}>{lightMode ? '🌙' : '☀️'}</span>
          {lightMode ? 'Dark' : 'Light'}
        </button>
      </nav>
    </div>
  )
}
