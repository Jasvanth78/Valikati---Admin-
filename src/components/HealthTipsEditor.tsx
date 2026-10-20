import { useEffect, useState } from 'react'
import { fetchApi } from '../utils/api'

type Tip = { id: string; contentTa: string; contentEn: string; meaningTa: string; meaningEn: string; enabled: boolean }
export default function HealthTipsEditor() {
  const [tips, setTips] = useState<Tip[]>([])
  const [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('')
  async function load() {
    try {
      const rows = await fetchApi('/api/admin/app-content')
      const raw = rows.find((row: any) => row.key === 'home_health_tips')?.ta || '[]'
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) throw Error('Invalid health tip data')
      setTips(parsed); setLoaded(true); setMessage('')
    } catch { setMessage('Could not load health tips. Retry before editing.') }
  }
  useEffect(() => { void load() }, [])
  function update(index: number, patch: Partial<Tip>) { setTips(tips.map((tip, i) => i === index ? { ...tip, ...patch } : tip)) }
  async function publish(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('')
    try {
      const value = JSON.stringify(tips)
      await fetchApi('/api/admin/app-content', { method: 'PUT', body: JSON.stringify({ key: 'home_health_tips', ta: value, en: value }) })
      setMessage('Health tips published to the Home proverb and health-tip slider.')
    } catch { setMessage('Could not publish. Your edits have been kept; retry.') }
    finally { setBusy(false) }
  }
  return <form onSubmit={publish} className="bg-astrology-card p-6 rounded-xl space-y-4">
    <h3 className="text-xl font-bold">மருத்துவக் குறிப்புகள் · Health Tips</h3>
    <p className="text-gray-400">Published tips alternate with proverbs in the same Home slider. Users can swipe or use the arrows. Add reviewed health information; leave English blank for automatic translation.</p>
    {message && <p role="status">{message}</p>}
    {!loaded ? <button type="button" onClick={load}>Retry loading health tips</button> : <>
      {tips.map((tip, index) => <fieldset key={tip.id} disabled={busy} className="border border-white/20 rounded-xl p-4 space-y-3">
        <legend>Health tip {index + 1}</legend>
        <label className="block"><input type="checkbox" checked={tip.enabled} onChange={e => update(index, { enabled: e.target.checked })} /> Show in Home slider</label>
        {(['contentTa', 'contentEn', 'meaningTa', 'meaningEn'] as const).map(field => <label className="block" key={field}>
          {{ contentTa: 'Tamil health tip', contentEn: 'English health tip', meaningTa: 'Tamil details (optional)', meaningEn: 'English details (optional)' }[field]}
          <textarea required={field === 'contentTa'} maxLength={field.startsWith('content') ? 1200 : 4000} value={tip[field] || ''}
            onChange={e => update(index, { [field]: e.target.value })} className="block w-full bg-black/40 border rounded p-3" />
        </label>)}
        <div className="flex gap-4"><button type="button" disabled={index === 0} onClick={() => { const next = [...tips]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; setTips(next) }}>Move up</button>
          <button type="button" onClick={() => setTips(tips.filter((_, i) => i !== index))}>Remove tip</button></div>
      </fieldset>)}
      <button disabled={busy} type="button" onClick={() => setTips([...tips, { id: crypto.randomUUID(), contentTa: '', contentEn: '', meaningTa: '', meaningEn: '', enabled: true }])} className="border rounded px-4 py-2">Add health tip</button>
      <button disabled={busy} className="bg-astrology-gold text-black rounded px-5 py-2 ml-3">{busy ? 'Publishing…' : 'Publish health tips'}</button>
    </>}
  </form>
}
