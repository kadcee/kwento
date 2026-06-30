import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PhotosScreen({ userId }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    loadPhotos()
  }, [])

  async function loadPhotos() {
    setLoading(true)
    const { data } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .eq('entry_type', 'photo')
      .order('created_at', { ascending: false })
    setPhotos(data || [])
    setLoading(false)
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '20px 20px 0' }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 16 }}>Photos</h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', marginTop: 40 }}>Loading...</p>
        ) : photos.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>📷</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No photos yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
              Photos you capture on the Today tab show up here
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6
          }}>
            {photos.map(photo => (
              <button
                key={photo.id}
                onClick={() => setSelected(photo)}
                style={{
                  aspectRatio: '1',
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  padding: 0
                }}
              >
                <img
                  src={photo.photo_url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20
          }}
        >
          <img
            src={selected.photo_url}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 12, objectFit: 'contain' }}
          />
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <p style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{formatDate(selected.created_at)}</p>
            {selected.moods?.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 20 }}>
                {selected.moods.map(m => <span key={m} style={{ marginRight: 4 }}>{m}</span>)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}