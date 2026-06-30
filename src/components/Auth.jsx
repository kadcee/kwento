import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendCode(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  async function handleVerifyCode(e) {
    e.preventDefault()
    if (!code) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email'
    })
    if (error) {
      setError(error.message)
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

      {!sent ? (
        <form onSubmit={handleSendCode} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
            {loading ? 'Sending...' : 'Send code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1rem',
            textAlign: 'center',
            marginBottom: 4
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✉️</div>
            <p style={{ fontWeight: 500, marginBottom: 4 }}>Check your email</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              Sent a 6-digit code to {email}
            </p>
          </div>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            required
            inputMode="numeric"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
              fontSize: 24,
              width: '100%',
              textAlign: 'center',
              letterSpacing: '0.3em'
            }}
          />
          {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              padding: '14px',
              fontSize: 15,
              fontWeight: 500,
              opacity: (loading || code.length !== 6) ? 0.4 : 1
            }}
          >
            {loading ? 'Verifying...' : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={() => { setSent(false); setCode(''); setError('') }}
            style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  )
}