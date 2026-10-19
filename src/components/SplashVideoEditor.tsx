import { useState } from 'react'
import { API_BASE_URL } from '../utils/api'

export function SplashVideoEditor({ value, onChange, onBusy }: { value: string; onChange: (url: string) => void; onBusy: (busy: boolean) => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function upload(file?: File) {
    if (!file) return
    if (!['video/mp4', 'video/webm'].includes(file.type) || file.size > 30 * 1024 * 1024) { setError('Choose an MP4 or WebM video smaller than 30 MB.'); return }
    setBusy(true); onBusy(true); setError('')
    try {
      const body = new FormData(); body.append('video', file)
      const response = await fetch(`${API_BASE_URL}/api/upload/video`, { method: 'POST', body })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Upload failed')
      onChange(data.url)
    } catch (error) { setError(error instanceof Error ? error.message : 'Upload failed') }
    finally { setBusy(false); onBusy(false) }
  }
  return <div className="space-y-3">
    <label>Upload splash video<input type="file" accept="video/mp4,video/webm" disabled={busy} onChange={e => void upload(e.target.files?.[0])} /></label>
    <label>Video URL<input value={value} disabled={busy} placeholder="https://example.com/intro.mp4" onChange={e => onChange(e.target.value)} /></label>
    <p className="text-xs text-gray-500">Use a short portrait MP4 for the best phone compatibility (up to 30 MB). Plays once at startup, for up to 30 seconds. Enable Splash video enabled after saving.</p>
    {busy && <p role="status">Uploading video…</p>}
    {error && <p role="alert">{error}</p>}
    {value && <video className="max-h-72 w-full" src={value.startsWith('/') ? `${API_BASE_URL}${value}` : value} controls playsInline preload="metadata" />}
  </div>
}
