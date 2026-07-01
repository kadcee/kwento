import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import CaptureScreen from './components/CaptureScreen'
import SummariesScreen from './components/SummariesScreen'
import PhotosScreen from './components/PhotosScreen'

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
        {tab === 'today' && <CaptureScreen userId={session.user.id} />}
        {tab === 'summaries' && <SummariesScreen userId={session.user.id} />}
        {tab === 'photos' && <PhotosScreen userId={session.user.id} />}
      </div>

      <nav style={{
        display: 'flex',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        {[
          { id: 'today', emoji: '◆', label: 'Today' },
          { id: 'photos', emoji: '🖼️', label: 'Gallery' },
          { id: 'summaries', emoji: '◇', label: 'Summaries' },
        ].map(({ id, emoji, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, padding: '12px 0',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              fontSize: 11, fontWeight: 500,
              color: tab === id ? 'var(--accent)' : 'var(--text-muted)',
              background: 'none', border: 'none', cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{emoji}</span>
            <span>{label}</span>
          </button>
        ))}

        <button
          onClick={() => setLightMode(prev => !prev)}
          style={{
            flex: 1, padding: '12px 0',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            fontSize: 11, fontWeight: 500,
            color: 'var(--text-muted)',
            background: 'none', border: 'none', cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>{lightMode ? '🌙' : '☀️'}</span>
          <span>{lightMode ? 'Dark' : 'Light'}</span>
        </button>
      </nav>
    </div>
  )
}