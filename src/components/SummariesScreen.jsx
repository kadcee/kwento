import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TABS = ['Week', 'Month', 'Year']

export default function SummariesScreen({ userId }) {
  const [activeTab, setActiveTab] = useState('Week')
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    loadSummaries()
  }, [activeTab])

  async function loadSummaries() {
    setLoading(true)
    const periodMap = { Week: 'weekly', Month: 'monthly', Year: 'yearly' }
    const { data } = await supabase
      .from('summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('period_type', periodMap[activeTab])
      .order('period_start', { ascending: false })
    setSummaries(data || [])
    setLoading(false)
  }

  async function saveNote(id) {
    await supabase.from('summaries').update({ user_note: noteText }).eq('id', id)
    setEditingId(null)
    loadSummaries()
  }

  function formatPeriodLabel(s) {
    const start = new Date(s.period_start)
    const end = new Date(s.period_end)
    if (s.period_type === 'weekly') {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    }
    if (s.period_type === 'monthly') {
      return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
    return start.getFullYear().toString()
  }

  function renderMoodCounts(counts) {
    if (!counts || Object.keys(counts).length === 0) return null
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
    return (
      <div>
        <p style={labelStyle}>Top moods</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {sorted.map(([emoji, count]) => (
            <div key={emoji} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '4px 10px', fontSize: 13
            }}>
              <span>{emoji}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{count}x</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderList(items, emoji, label) {
    if (!items || items.length === 0) return null
    return (
      <div>
        <p style={labelStyle}>{emoji} {label}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: 'var(--text-secondary)' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', marginTop: 6, flexShrink: 0 }} />
              <span>{typeof item === 'string' ? item : item.description || item.text || JSON.stringify(item)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderYearMonthRow(s) {
    const monthName = new Date(s.period_start).toLocaleDateString('en-US', { month: 'long' })
    const topMoods = s.mood_counts ? Object.entries(s.mood_counts).sort((a,b) => b[1]-a[1]).slice(0,2).map(([e]) => e).join('') : ''
    const snippet = s.ai_narrative ? s.ai_narrative.slice(0, 60) + '...' : 'No entries'
    return (
      <div key={s.id} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 8
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 500 }}>{monthName}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{snippet}</p>
        </div>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{topMoods}</span>
      </div>
    )
  }

  const labelStyle = {
    fontSize: 11, fontWeight: 500, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '20px 20px 0' }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 16 }}>Summaries</h1>
        <div style={{
          display: 'flex', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 16
        }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '9px 0', fontSize: 13,
              background: activeTab === tab ? 'var(--accent)' : 'var(--surface)',
              color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
              fontWeight: activeTab === tab ? 500 : 400,
              border: 'none', cursor: 'pointer'
            }}>{tab}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', marginTop: 40 }}>Loading...</p>
        ) : summaries.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>◇</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No summaries yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
              {activeTab === 'Week' ? 'Generated every Sunday night' : activeTab === 'Month' ? 'Generated on the last day of the month' : 'Generated on December 31'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {summaries.map(s => (
              <div key={s.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{formatPeriodLabel(s)}</span>
                  <span style={{
                    fontSize: 10, color: 'var(--text-muted)', background: 'var(--surface-2)',
                    border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 20
                  }}>AI generated</span>
                </div>

                {s.ai_narrative && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{s.ai_narrative}</p>
                )}

                {renderMoodCounts(s.mood_counts)}

                {activeTab !== 'Week' && (
                  <>
                    {renderList(s.highs, '✨', 'Highs')}
                    {renderList(s.accomplishments, '🏆', 'Accomplishments')}
                    {renderList(s.trips, '✈️', 'Trips & new places')}
                    {renderList(s.lows, '🌧', 'Lows')}
                  </>
                )}

                {activeTab === 'Week' && s.highlights?.length > 0 && (
                  <div>
                    <p style={labelStyle}>Moments worth remembering</p>
                    {renderList(s.highlights, '•', '')}
                  </div>
                )}

                {activeTab !== 'Year' && (s.days_captured > 0 || s.entry_count > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { num: s.days_captured, lbl: 'Days captured' },
                      { num: s.entry_count, lbl: 'Total entries' }
                    ].map(({ num, lbl }) => (
                      <div key={lbl} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 500 }}>{num}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{lbl}</div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'Year' && summaries.filter(s2 => s2.period_type === 'monthly').length > 0 && (
                  <div>
                    <p style={labelStyle}>Browse by month</p>
                    {summaries.filter(s2 => s2.period_type === 'monthly').map(ms => renderYearMonthRow(ms))}
                  </div>
                )}

                <div>
                  {editingId === s.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Add your own note..."
                        rows={3}
                        style={{
                          width: '100%', background: 'var(--surface-2)',
                          border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)',
                          padding: '10px 12px', fontSize: 13, color: 'var(--text)', resize: 'none'
                        }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => saveNote(s.id)} style={{
                          flex: 1, padding: '9px', background: 'var(--accent)', color: '#fff',
                          borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500
                        }}>Save note</button>
                        <button onClick={() => setEditingId(null)} style={{
                          padding: '9px 14px', background: 'var(--surface-2)',
                          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)'
                        }}>Cancel</button>
                      </div>
                    </div>
                  ) : s.user_note ? (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Your note</p>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{s.user_note}</p>
                      <button onClick={() => { setEditingId(s.id); setNoteText(s.user_note) }} style={{
                        fontSize: 11, color: 'var(--accent)', marginTop: 6
                      }}>Edit note</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingId(s.id); setNoteText('') }} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 12, color: 'var(--accent)'
                    }}>
                      <span>✏️</span> Add your own note
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
