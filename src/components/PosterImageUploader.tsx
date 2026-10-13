import { useRef, useState } from 'react'
import { UploadCloud, Loader2, X } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'

export default function PosterImageUploader({ value, onChange, onBusy }: { value: string; onChange: (url: string) => void; onBusy: (busy: boolean) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function upload(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError('Choose a JPG, PNG, WEBP or GIF, up to 10 MB.'); return
    }
    setBusy(true); onBusy(true); setError('')
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 120000)
    try {
      const body = new FormData(); body.append('image', file); body.append('folder', 'valikatti_posters')
      const response = await fetch(`${API_BASE_URL}/api/admin/poster-posts/upload`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }, body, signal: controller.signal })
      const data = await response.json()
      if (!response.ok || !data.url) throw new Error(data.error || 'Image upload failed')
      onChange(data.url)
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed. Please retry.') }
    finally { clearTimeout(timeout); setBusy(false); onBusy(false); if (input.current) input.current.value = '' }
  }
  return <div className="space-y-3">
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" aria-label="Upload poster image" onChange={e => { if (e.target.files?.[0]) void upload(e.target.files[0]) }} />
    <button type="button" disabled={busy} onClick={() => input.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!busy && e.dataTransfer.files[0]) void upload(e.dataTransfer.files[0]) }} className="w-full border-2 border-dashed border-emerald-500/40 rounded-2xl p-6 bg-emerald-500/5 flex flex-col items-center gap-3 disabled:opacity-50">
      {busy ? <Loader2 className="animate-spin text-amber-300" /> : <UploadCloud className="text-emerald-300" size={32} />}
      <span>{busy ? 'Uploading poster…' : value ? 'Replace poster image' : 'Choose a poster image or drop it here'}</span>
      <span className="text-xs text-gray-400">JPG, PNG, WEBP, GIF · up to 10 MB · original proportions preserved</span>
    </button>
    {error && <p role="alert" className="text-rose-300 text-sm">{error}</p>}
    {value && <div className="relative bg-black/20 rounded-xl p-2"><img src={value.startsWith('/') ? `${API_BASE_URL}${value}` : value} alt="Poster preview" className="w-full max-h-96 object-contain rounded-lg" /><button type="button" disabled={busy} onClick={() => onChange('')} aria-label="Remove poster image" className="absolute top-3 right-3 bg-black/70 rounded-full p-2"><X size={16} /></button></div>}
  </div>
}
