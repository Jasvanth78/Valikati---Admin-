import { useEffect, useState } from 'react'
import { fetchApi } from '../utils/api'

export default function SakunamCategoryManager({ categories, entries, onChanged }: {
  categories: { value: string; label: string }[]; entries: { category: string }[]; onChanged: () => void
}) {
  const [hidden, setHidden] = useState<string[]>([]), [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('')
  async function load() {
    try {
      const rows = await fetchApi('/api/admin/app-content')
      const value = JSON.parse(rows.find((row: any) => row.key === 'sakunam_hidden_categories')?.en || '[]')
      if (!Array.isArray(value) || value.some(key => typeof key !== 'string')) throw Error('Invalid settings')
      setHidden(value); setLoaded(true)
    } catch { setMessage('Could not load category settings. Retry to manage categories.') }
  }
  useEffect(() => { void load() }, [])
  async function visibility(key: string, label: string) {
    const removing = !hidden.includes(key)
    if (removing && !window.confirm(`Remove ${label} from the app? Its entries will be kept and you can restore the category here.`)) return
    setBusy(true)
    try {
      const next = removing ? [...hidden, key] : hidden.filter(value => value !== key)
      await fetchApi('/api/admin/app-content', { method: 'PUT', body: JSON.stringify({ key: 'sakunam_hidden_categories', ta: JSON.stringify(next), en: JSON.stringify(next) }) })
      setHidden(next); setMessage(removing ? 'Category removed from the app. Entries kept; use Restore category to bring it back.' : 'Category restored in the app.')
    } catch (error) { setMessage((error as Error).message) }
    finally { setBusy(false) }
  }
  async function removeEntries(key: string, label: string, count: number) {
    if (!window.confirm(`Permanently delete all ${count} entries in ${label}? This cannot be undone. Other categories will be kept.`)) return
    setBusy(true)
    try {
      const result = await fetchApi(`/api/admin/sakunam/categories/${encodeURIComponent(key)}`, { method: 'DELETE' })
      setMessage(`${result.deleted} entries deleted. The category is still available; use Remove from app if you also want to hide its tile.`); onChanged()
    } catch (error) { setMessage((error as Error).message) }
    finally { setBusy(false) }
  }
  return <details className="bg-white border rounded-xl p-5">
    <summary className="font-bold text-teal-800 cursor-pointer">Manage / remove Sakunam categories</summary>
    <p className="text-sm text-gray-500 my-3">Remove a category tile from the app, restore it later, or permanently delete its entries. To delete just one entry, use Delete on its card below.</p>
    {message && <p role="status" className="text-sm my-3">{message}</p>}
    {!loaded ? <button onClick={load}>Retry loading categories</button> : <div className="divide-y">{categories.map(category => {
      const count = entries.filter(entry => entry.category === category.value).length
      const removed = hidden.includes(category.value)
      return <div key={category.value} className="flex flex-wrap items-center gap-3 py-3"><span className="flex-1 min-w-48 text-sm">{category.label}<small className="block text-gray-500">{count} entries · {removed ? 'Removed from app' : 'Visible in app'}</small></span>
        <button disabled={busy} onClick={() => void visibility(category.value, category.label)} className="border rounded px-3 py-2 text-sm text-teal-800">{removed ? 'Restore category' : 'Remove from app'}</button>
        <button disabled={busy || count === 0} onClick={() => void removeEntries(category.value, category.label, count)} className="border border-red-200 rounded px-3 py-2 text-sm text-red-700 disabled:opacity-40">Delete entries</button>
      </div>
    })}</div>}
  </details>
}
