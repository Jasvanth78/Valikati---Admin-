import { useCallback, useEffect, useState } from 'react'
import { Image, Plus, Edit2, Trash2, Eye, EyeOff, Loader2, X, RefreshCw } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'
import PosterImageUploader from '../components/PosterImageUploader'

type Category = { id: string; slug: string; nameTa: string; nameEn: string }
type Poster = { id: string; imageUrl: string; caption: string; categoryId: string; category?: Category; status: string; effectiveStatus: string; isEnabled: boolean; publishedAt: string | null; createdAt: string; likeCount: number }
type Form = { imageUrl: string; caption: string; categoryId: string; status: string; isEnabled: boolean; publishedAt: string }
const blank: Form = { imageUrl: '', caption: '', categoryId: '', status: 'draft', isEnabled: true, publishedAt: '' }
const inputClass = 'w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:border-emerald-400 outline-none'
class RequestError extends Error { constructor(message: string, public status: number) { super(message) } }
async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}/api/admin/poster-posts${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('adminToken')}`, ...options.headers } })
  const data = await response.json()
  if (!response.ok) throw new RequestError(data.error || 'Poster request failed', response.status)
  return data
}
function localDate(value: string | null) { if (!value) return ''; const d = new Date(value); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }

export default function PosterPosts() {
  const [posters, setPosters] = useState<Poster[]>([]), [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [uploading, setUploading] = useState(false)
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [authRequired, setAuthRequired] = useState(false)
  const [filter, setFilter] = useState('all'), [page, setPage] = useState(1), [totalPages, setTotalPages] = useState(0), [total, setTotal] = useState(0)
  const [open, setOpen] = useState(false), [editing, setEditing] = useState<string | null>(null), [form, setForm] = useState<Form>(blank)
  const [categoryOpen, setCategoryOpen] = useState(false), [newCategory, setNewCategory] = useState({ slug: '', nameTa: '', nameEn: '' })
  const [email, setEmail] = useState(''), [password, setPassword] = useState('')
  const fail = useCallback((e: unknown) => { if (e instanceof RequestError && (e.status === 401 || e.status === 403)) setAuthRequired(true); setError(e instanceof Error ? e.message : 'Please retry.') }, [])
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [result, cats] = await Promise.all([request(`?page=${page}&status=${filter}`), request('/categories')])
      setPosters(result.items); setTotalPages(result.totalPages); setTotal(result.total); setCategories(cats); setAuthRequired(false)
    } catch (e) { fail(e) }
    finally { setLoading(false) }
  }, [page, filter, fail])
  useEffect(() => { void load() }, [load])
  const change = <K extends keyof Form>(key: K, value: Form[K]) => setForm(previous => ({ ...previous, [key]: value }))
  async function save() {
    if (!form.imageUrl || !form.categoryId) { setError('Upload an image and select a category.'); return }
    if (form.status === 'scheduled' && (!form.publishedAt || new Date(form.publishedAt) <= new Date())) { setError('Choose a future publication time.'); return }
    setSaving(true); setError('')
    try {
      await request(editing ? `/${editing}` : '', { method: editing ? 'PUT' : 'POST', body: JSON.stringify({ ...form, publishedAt: form.status === 'scheduled' ? new Date(form.publishedAt).toISOString() : null }) })
      setOpen(false); setNotice(form.status === 'draft' ? 'Poster saved as draft.' : form.status === 'scheduled' ? 'Poster scheduled.' : 'Poster published. It is now available in the mobile feed.'); await load()
    } catch (e) { fail(e) }
    finally { setSaving(false) }
  }
  async function toggle(poster: Poster) {
    setSaving(true); setError('')
    try { await request(`/${poster.id}`, { method: 'PUT', body: JSON.stringify({ isEnabled: !poster.isEnabled }) }); await load() }
    catch (e) { fail(e) } finally { setSaving(false) }
  }
  async function remove(poster: Poster) {
    if (!window.confirm('Delete this poster and its likes/bookmarks? This cannot be undone.')) return
    setSaving(true); setError('')
    try { await request(`/${poster.id}`, { method: 'DELETE' }); if (posters.length === 1 && page > 1) setPage(page - 1); else await load() }
    catch (e) { fail(e) } finally { setSaving(false) }
  }
  async function signIn() {
    setSaving(true); setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await response.json(); if (!response.ok || !data.token) throw new Error(data.message || data.error || 'Sign-in failed')
      localStorage.setItem('adminToken', data.token); setPassword(''); setAuthRequired(false); await load()
    } catch (e) { fail(e) } finally { setSaving(false) }
  }
  async function addCategory() {
    setSaving(true); setError('')
    try { const category: Category = await request('/categories', { method: 'POST', body: JSON.stringify(newCategory) }); setCategories(previous => [...previous, category]); change('categoryId', category.id); setCategoryOpen(false); setNewCategory({ slug: '', nameTa: '', nameEn: '' }) }
    catch (e) { fail(e) } finally { setSaving(false) }
  }
  return <div className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-3xl text-astrology-gold font-bold flex items-center gap-3"><Image /> Poster Posts</h2><p className="text-gray-400 mt-2">Tamil greeting posters · {total} posters</p></div><div className="flex gap-2"><button onClick={() => void load()} disabled={loading} className="p-3 rounded-xl border border-white/10" aria-label="Refresh posters"><RefreshCw size={18} /></button><button disabled={authRequired} onClick={() => { setEditing(null); setForm({ ...blank, categoryId: categories[0]?.id || '' }); setError(''); setOpen(true) }} className="flex items-center gap-2 bg-emerald-700 rounded-xl px-4 py-3 disabled:opacity-50"><Plus size={18} /> New poster</button></div></header>
    {error && <div role="alert" className="p-4 rounded-xl bg-rose-500/10 text-rose-300">{error}</div>}
    {notice && <div role="status" className="p-4 rounded-xl bg-emerald-500/10 text-emerald-300">{notice}</div>}
    {authRequired ? <form onSubmit={e => { e.preventDefault(); void signIn() }} className="max-w-md p-6 rounded-2xl bg-astrology-card border border-astrology-gold/20 space-y-4"><h3 className="text-xl font-bold">Admin sign-in</h3><p className="text-sm text-gray-400">Use your existing Valikati admin account to manage posters.</p><input type="email" required aria-label="Admin email" placeholder="Admin email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} /><input type="password" required aria-label="Admin password" autoComplete="current-password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} /><button disabled={saving} className="bg-emerald-700 rounded-xl px-4 py-2">{saving ? 'Signing in…' : 'Sign in'}</button></form> : <>
      <div className="flex flex-wrap gap-2">{['all', 'published', 'draft', 'scheduled'].map(status => <button key={status} onClick={() => { setFilter(status); setPage(1) }} className={`px-4 py-2 rounded-full capitalize ${filter === status ? 'bg-emerald-700 text-white' : 'bg-white/5 text-gray-300'}`}>{status}</button>)}</div>
      {loading ? <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-amber-300" /></div> : posters.length === 0 ? <div className="p-16 text-center text-gray-400 border border-dashed border-white/15 rounded-2xl">No posters in this view. Create your first greeting poster.</div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">{posters.map(poster => <article key={poster.id} className="bg-astrology-card rounded-2xl border border-astrology-gold/15 overflow-hidden"><div className="bg-black/20"><img src={poster.imageUrl.startsWith('/') ? `${API_BASE_URL}${poster.imageUrl}` : poster.imageUrl} alt={poster.caption || poster.category?.nameEn || 'Greeting poster'} className="w-full h-60 object-contain" /></div><div className="p-4 space-y-3"><div className="flex flex-wrap gap-2"><span className="text-xs px-2 py-1 rounded-full bg-emerald-800/50 capitalize">{poster.effectiveStatus}</span>{!poster.isEnabled && <span className="text-xs px-2 py-1 rounded-full bg-rose-800/50">Disabled</span>}<span className="text-xs text-amber-200">{poster.category?.nameTa}</span></div>{poster.caption && <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">{poster.caption}</p>}<p className="text-xs text-gray-400">{poster.publishedAt ? `${poster.effectiveStatus === 'scheduled' ? 'Scheduled' : 'Published'}: ${new Date(poster.publishedAt).toLocaleString()}` : `Created: ${new Date(poster.createdAt).toLocaleString()}`} · {poster.likeCount} likes</p><div className="flex gap-2"><button aria-label="Edit poster" disabled={saving} onClick={() => { setEditing(poster.id); setForm({ imageUrl: poster.imageUrl, caption: poster.caption, categoryId: poster.categoryId, status: poster.effectiveStatus, publishedAt: localDate(poster.publishedAt), isEnabled: poster.isEnabled }); setOpen(true); setError('') }} className="p-2 bg-white/5 rounded-lg"><Edit2 size={17} /></button><button aria-label={poster.isEnabled ? 'Disable poster' : 'Enable poster'} disabled={saving} onClick={() => void toggle(poster)} className="p-2 bg-white/5 rounded-lg">{poster.isEnabled ? <Eye size={17} /> : <EyeOff size={17} />}</button><button aria-label="Delete poster" disabled={saving} onClick={() => void remove(poster)} className="p-2 bg-rose-500/10 text-rose-300 rounded-lg"><Trash2 size={17} /></button></div></div></article>)}</div>}
      {totalPages > 1 && <div className="flex items-center justify-center gap-4"><button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} / {totalPages}</span><button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button></div>}
    </>}
    {open && <div className="fixed inset-0 z-40 bg-black/70 overflow-y-auto p-4 flex items-start justify-center"><form role="dialog" aria-modal="true" aria-label={editing ? 'Edit poster' : 'Create poster'} onSubmit={e => { e.preventDefault(); void save() }} className="w-full max-w-3xl bg-astrology-card rounded-2xl border border-astrology-gold/20 p-6 my-8 space-y-5"><div className="flex justify-between"><h3 className="text-xl text-amber-200 font-bold">{editing ? 'Edit poster' : 'Create poster'}</h3><button type="button" disabled={saving || uploading} onClick={() => setOpen(false)} aria-label="Close poster form"><X /></button></div>{error && <p role="alert" className="text-rose-300">{error}</p>}<PosterImageUploader value={form.imageUrl} onChange={value => change('imageUrl', value)} onBusy={setUploading} /><label className="block space-y-2"><span>Caption (optional)</span><textarea maxLength={500} rows={2} value={form.caption} onChange={e => change('caption', e.target.value)} className={inputClass} /></label><div className="grid sm:grid-cols-2 gap-4"><label className="space-y-2"><span>Poster category</span><select required value={form.categoryId} onChange={e => change('categoryId', e.target.value)} className={`${inputClass} [&>option]:bg-slate-900`}><option value="">Select category</option>{categories.map(category => <option key={category.id} value={category.id}>{category.nameTa} / {category.nameEn}</option>)}</select></label><label className="space-y-2"><span>Publication</span><select value={form.status} onChange={e => change('status', e.target.value)} className={`${inputClass} [&>option]:bg-slate-900`}><option value="draft">Save as draft</option><option value="published">Publish now</option><option value="scheduled">Schedule publication</option></select></label></div>{form.status === 'scheduled' && <label className="block space-y-2"><span>Publication time (your local timezone)</span><input type="datetime-local" required value={form.publishedAt} onChange={e => change('publishedAt', e.target.value)} className={inputClass} /></label>}<label className="flex items-center gap-2"><input type="checkbox" checked={form.isEnabled} onChange={e => change('isEnabled', e.target.checked)} /> Enabled in feed when published</label><button type="button" onClick={() => setCategoryOpen(!categoryOpen)} className="text-emerald-300 text-sm">+ Create a poster category</button>{categoryOpen && <fieldset className="space-y-3 border border-white/15 rounded-xl p-4"><legend>New poster category</legend><input aria-label="Category slug" placeholder="Unique slug, e.g. special-greetings" pattern="[a-z][a-z0-9-]{1,49}" value={newCategory.slug} onChange={e => setNewCategory({ ...newCategory, slug: e.target.value })} className={inputClass} /><input aria-label="Category Tamil name" placeholder="Tamil name" value={newCategory.nameTa} onChange={e => setNewCategory({ ...newCategory, nameTa: e.target.value })} className={inputClass} /><input aria-label="Category English name" placeholder="English name" value={newCategory.nameEn} onChange={e => setNewCategory({ ...newCategory, nameEn: e.target.value })} className={inputClass} /><button type="button" disabled={saving} onClick={() => void addCategory()} className="bg-emerald-700 rounded-lg px-3 py-2">Create category</button></fieldset>}<div className="flex justify-end gap-3"><button type="button" disabled={saving || uploading} onClick={() => setOpen(false)} className="px-4 py-2">Cancel</button><button disabled={saving || uploading || !form.imageUrl} className="bg-emerald-700 px-5 py-3 rounded-xl disabled:opacity-50">{saving ? 'Saving…' : form.status === 'draft' ? 'Save draft' : form.status === 'scheduled' ? 'Schedule poster' : 'Publish poster'}</button></div></form></div>}
  </div>
}
