import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      gap: '2rem'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>◆</div>
        <h1 style={{ fontSize: 28, fontWeight: 500, marginBottom: 8 }}>Kwento</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Your story, one moment at a time</p>
      </div>

      {sent ? (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          textAlign: 'center',
          width: '100%'
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✉️</div>
          <p style={{ fontWeight: 500, marginBottom: 6 }}>Check your email</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Sent a login link to {email}
          </p>
        </div>
      ) : (
        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
              fontSize: 16,
              width: '100%'
            }}
          />
          {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              padding: '14px',
              fontSize: 15,
              fontWeight: 500,
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Sending...' : 'Send login link'}
          </button>
        </form>
      )}
    </div>
  )
}
