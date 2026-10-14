import { createElement, useEffect, useRef, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Bell, Star, Compass, Heart, Sun, Moon, Calendar, Sparkles, Flower2, Gift, BookOpen, Megaphone, MessageCircle, Camera, Music, Clock, Shield, Zap, Flame, Leaf, MapPin, CircleCheck, Upload, Loader2, Check, Code } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'
import { normalizeNotificationIcon } from './notificationIconImage'

type Asset = { id: string; label: string; imageUrl: string }
const library = [
  ['Bell', Bell], ['Star', Star], ['Compass', Compass], ['Heart', Heart], ['Sun', Sun], ['Moon', Moon],
  ['Calendar', Calendar], ['Sparkles', Sparkles], ['Flower', Flower2], ['Gift', Gift], ['Book', BookOpen],
  ['Megaphone', Megaphone], ['Message', MessageCircle], ['Camera', Camera], ['Music', Music], ['Clock', Clock],
  ['Shield', Shield], ['Lightning', Zap], ['Flame', Flame], ['Leaf', Leaf], ['Location', MapPin], ['Check', CircleCheck],
] as const
export function parseNotificationIcon(value: string): { label: string; imageUrl: string } | null {
  try { const data = JSON.parse(value); return typeof data.label === 'string' && typeof data.imageUrl === 'string' ? data : null } catch { return null }
}
export default function NotificationIconPicker({ value, onChange, onBusy }: { value: string; onChange: (value: string) => void; onBusy: (value: boolean) => void }) {
  const [assets, setAssets] = useState<Asset[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [svgOpen, setSvgOpen] = useState(false), [svg, setSvg] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const selected = parseNotificationIcon(value)
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_BASE_URL}/api/admin/notification-icons`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }, signal: controller.signal })
      .then(async response => { if (!response.ok) throw Error('Could not load uploaded icons.'); setAssets(await response.json()) })
      .catch(error => { if (error.name !== 'AbortError') setError(error.message) })
    return () => controller.abort()
  }, [])
  async function upload(file: Blob, label: string) {
    setBusy(true); onBusy(true); setError('')
    try {
      const png = await normalizeNotificationIcon(file)
      const body = new FormData(); body.append('image', png, 'notification-icon.png'); body.append('label', label)
      const response = await fetch(`${API_BASE_URL}/api/admin/notification-icons`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }, body, signal: AbortSignal.timeout(20000) })
      const asset = await response.json()
      if (!response.ok) throw Error(asset.error || 'Icon upload failed.')
      setAssets(previous => [asset, ...previous]); onChange(JSON.stringify({ label: asset.label, imageUrl: asset.imageUrl })); setSvgOpen(false)
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not upload icon.') }
    finally { setBusy(false); onBusy(false); if (input.current) input.current.value = '' }
  }
  return <div className="space-y-5">
    <label>Android Notification-bar Icon<select aria-label="Android Notification-bar Icon" disabled={busy} value={selected ? 'custom' : value} onChange={event => { if (event.target.value !== 'custom') onChange(event.target.value) }}>
      <option value="ic_notification">Original icon</option><option value="ic_notification_star">Star</option><option value="ic_notification_compass">Compass</option>{selected && <option value="custom">{selected.label} (uploaded)</option>}
    </select></label>
    {selected && <div className="flex items-center gap-3"><div className="notification-icon-preview"><img src={`${API_BASE_URL}${selected.imageUrl}`} alt={`${selected.label} notification preview`} /></div><span className="text-sm">{selected.label}</span><Check size={16} className="text-emerald-600" /></div>}
    <div><p className="text-xs font-semibold mb-3">Icon library</p><div className="notification-icon-grid">{library.map(([label, Icon]) => <button key={label} type="button" disabled={busy} title={label} aria-label={`Use ${label} icon`} className="notification-icon-choice" onClick={() => void upload(new Blob([renderToStaticMarkup(createElement(Icon, { width: 96, height: 96, color: '#000', strokeWidth: 2 }))], { type: 'image/svg+xml' }), label)}><Icon size={23} /><span>{label}</span></button>)}</div></div>
    {assets.length > 0 && <div><p className="text-xs font-semibold mb-3">Uploaded icons</p><div className="notification-icon-grid">{assets.map(asset => <button type="button" key={asset.id} disabled={busy} title={asset.label} aria-label={`Use uploaded ${asset.label}`} className={`notification-icon-choice ${selected?.imageUrl === asset.imageUrl ? 'selected' : ''}`} onClick={() => onChange(JSON.stringify({ label: asset.label, imageUrl: asset.imageUrl }))}><div className="notification-icon-preview"><img src={`${API_BASE_URL}${asset.imageUrl}`} alt="" /></div><span>{asset.label}</span></button>)}</div></div>}
    <div className="flex flex-wrap gap-2"><button type="button" className="secondary-button flex items-center gap-2" disabled={busy} onClick={() => input.current?.click()}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}Upload icon</button><button type="button" className="secondary-button flex items-center gap-2" disabled={busy} onClick={() => setSvgOpen(!svgOpen)}><Code size={16} />Paste SVG</button></div>
    <p className="text-xs text-gray-500">PNG, SVG, WEBP or JPG, up to 1 MB. Flaticon and React Icons SVG exports supported. Android displays a white silhouette.</p>
    <input ref={input} type="file" accept="image/png,image/svg+xml,image/webp,image/jpeg" className="hidden" aria-label="Upload notification icon" onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file, file.name.replace(/\.[^.]+$/, '').slice(0, 80)) }} />
    {svgOpen && <div><label>SVG markup<textarea aria-label="SVG markup" value={svg} onChange={event => setSvg(event.target.value)} placeholder="<svg ...>...</svg>" /></label><button type="button" disabled={busy || !svg.trim()} className="secondary-button mt-2" onClick={() => void upload(new Blob([svg], { type: 'image/svg+xml' }), 'Custom SVG icon')}>Use SVG</button></div>}
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
  </div>
}
