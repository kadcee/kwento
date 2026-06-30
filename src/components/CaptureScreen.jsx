import React, { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const MOODS = [
  { emoji: '😄', label: 'Great' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😐', label: 'Meh' },
  { emoji: '😔', label: 'Low' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '🙏', label: 'Grateful' },
  { emoji: '🤩', label: 'Excited' },
  { emoji: '😴', label: 'Tired' },
]

export default function CaptureScreen({ userId }) {
  const [text, setText] = useState('')
  const [selectedMoods, setSelectedMoods] = useState([])
  const [showMoods, setShowMoods] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [entries, setEntries] = useState([])
  const [recording, setRecording] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const recognitionRef = useRef(null)
  const photoInputRef = useRef(null)

  useEffect(() => {
    loadTodayEntries()
  }, [])

  async function loadTodayEntries() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { data } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
    if (data) setEntries(data)
  }

  function toggleMood(mood) {
    setSelectedMoods(prev =>
      prev.includes(mood.emoji)
        ? prev.filter(m => m !== mood.emoji)
        : [...prev, mood.emoji]
    )
  }

  async function handleSave() {
    if (!text.trim() && selectedMoods.length === 0) return
    setSaving(true)
    const { error } = await supabase.from('entries').insert({
      user_id: userId,
      content: text.trim() || null,
      moods: selectedMoods,
      entry_type: 'text'
    })
    if (!error) {
      setText('')
      setSelectedMoods([])
      setShowMoods(false)
      setSavedMsg('Saved')
      setTimeout(() => setSavedMsg(''), 2000)
      loadTodayEntries()
    }
    setSaving(false)
  }

  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice not supported in this browser. Use Chrome or Safari.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = e => {
      const transcript = e.results[0][0].transcript
      setText(prev => prev ? prev + ' ' + transcript : transcript)
      setRecording(false)
    }
    recognition.onerror = () => setRecording(false)
    recognition.onend = () => setRecording(false)
    recognition.start()
    recognitionRef.current = recognition
    setRecording(true)
  }

  function stopVoice() {
    recognitionRef.current?.stop()
    setRecording(false)
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(path, file)
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path)
      await supabase.from('entries').insert({
        user_id: userId,
        photo_url: publicUrl,
        moods: selectedMoods,
        entry_type: 'photo'
      })
      setSavedMsg('Photo saved')
      setTimeout(() => setSavedMsg(''), 2000)
      loadTodayEntries()
    }
    setUploadingPhoto(false)
    e.target.value = ''
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>Today</h1>
        <span style={{
          fontSize: 12,
          color: 'var(--accent)',
          background: 'var(--accent-bg)',
          border: '1px solid var(--accent-border)',
          padding: '4px 10px',
          borderRadius: 20
        }}>{today}</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 16,
          marginBottom: 12
        }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Something on your mind? Drop it here..."
            rows={4}
            style={{
              width: '100%',
              fontSize: 15,
              lineHeight: 1.6,
              color: 'var(--text)',
              background: 'none',
              border: 'none',
              outline: 'none',
              resize: 'none'
            }}
          />

          {selectedMoods.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              {selectedMoods.map(m => (
                <span key={m} style={{ fontSize: 20 }}>{m}</span>
              ))}
            </div>
          )}
        </div>

        {showMoods && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 16,
            marginBottom: 12
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>How are you feeling? Pick all that apply.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {MOODS.map(mood => (
                <button
                  key={mood.emoji}
                  onClick={() => toggleMood(mood)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '10px 6px',
                    background: selectedMoods.includes(mood.emoji) ? 'var(--accent-bg)' : 'var(--surface-2)',
                    border: selectedMoods.includes(mood.emoji) ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 22,
                    cursor: 'pointer'
                  }}
                >
                  {mood.emoji}
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{mood.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          <button
            onClick={recording ? stopVoice : startVoice}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '12px 6px',
              background: recording ? 'rgba(224,87,87,0.12)' : 'var(--surface)',
              border: recording ? '1px solid rgba(224,87,87,0.4)' : '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', fontSize: 11, color: recording ? 'var(--danger)' : 'var(--text-secondary)'
            }}
          >
            <span style={{ fontSize: 22 }}>{recording ? '⏹' : '🎙️'}</span>
            {recording ? 'Stop' : 'Voice'}
          </button>

          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingPhoto}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '12px 6px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--text-secondary)'
            }}
          >
            <span style={{ fontSize: 22 }}>📷</span>
            {uploadingPhoto ? 'Saving...' : 'Photo'}
          </button>
          <input ref={photoInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} />

          <button
            onClick={() => setShowMoods(!showMoods)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '12px 6px',
              background: showMoods ? 'var(--accent-bg)' : 'var(--surface)',
              border: showMoods ? '1px solid var(--accent-border)' : '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', fontSize: 11, color: showMoods ? 'var(--accent)' : 'var(--text-secondary)'
            }}
          >
            <span style={{ fontSize: 22 }}>🙂</span>
            Mood
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || (!text.trim() && selectedMoods.length === 0)}
          style={{
            width: '100%',
            padding: '14px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 'var(--radius-sm)',
            fontSize: 15,
            fontWeight: 500,
            marginBottom: 24,
            opacity: (saving || (!text.trim() && selectedMoods.length === 0)) ? 0.4 : 1,
            transition: 'opacity 0.15s'
          }}
        >
          {savedMsg || (saving ? 'Saving...' : 'Save')}
        </button>

        {entries.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Earlier today
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {entries.map(entry => (
                <div key={entry.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 42, paddingTop: 2 }}>
                    {formatTime(entry.created_at)}
                  </span>
                  <div style={{
                    flex: 1,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 13,
                    color: 'var(--text)'
                  }}>
                    {entry.entry_type === 'photo' ? (
  <img
    src={entry.photo_url}
    alt="Captured moment"
    style={{
      width: '100%',
      maxWidth: 160,
      borderRadius: 8,
      display: 'block'
    }}
  />
) : (
                      <>
                        {entry.content && <p style={{ marginBottom: entry.moods?.length ? 6 : 0 }}>{entry.content}</p>}
                        {entry.moods?.length > 0 && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            {entry.moods.map(m => <span key={m} style={{ fontSize: 16 }}>{m}</span>)}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
