import React, { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, ChevronLeft, ChevronRight, CircleHelp, Copy, Eye, FileText, Globe, Home, Image, Layers, LayoutGrid, MapPin, Megaphone, Moon, Pause, Pencil, Plus, Save, Search, SlidersHorizontal, Smartphone, Star, Trash2, ArrowDownUp, X, Video } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'
import './AdManagement.css'

type Format = 'banner' | 'native' | 'interstitial' | 'rewarded'
type Slot = { key: string; label: string; formats: Format[]; size?: string }
type Page = { key: string; label: string; slots: Slot[] }
type Placement = { id?: string; pageKey: string; placementKey: string; adFormat: Format; androidAdUnitId: string; iosAdUnitId: string; isEnabled: boolean; sortOrder: number; frequencyCap: number }
type Configuration = { globalEnabled: boolean; pages: Record<string, boolean>; placements: Placement[]; registry: { pages: Page[] } }
const blank: Placement = { pageKey: '', placementKey: '', adFormat: 'banner', androidAdUnitId: '', iosAdUnitId: '', isEnabled: true, sortOrder: 1, frequencyCap: 120 }
const pageIcons: Record<string, typeof Home> = { home: Home, articles: FileText, calendar: CalendarDays, panchangam: Moon, festivals: Star, poster_posts: Image, reels: Video }
const formatNames = { banner: 'Banner', native: 'Native', interstitial: 'Interstitial', rewarded: 'Rewarded' }
const testIds = {
  android: { banner: 'ca-app-pub-3940256099942544/6300978111', native: 'ca-app-pub-3940256099942544/2247696110', interstitial: 'ca-app-pub-3940256099942544/1033173712', rewarded: 'ca-app-pub-3940256099942544/5224354917' },
  ios: { banner: 'ca-app-pub-3940256099942544/2934735716', native: 'ca-app-pub-3940256099942544/3986624511', interstitial: 'ca-app-pub-3940256099942544/4411468910', rewarded: 'ca-app-pub-3940256099942544/1712485313' },
}
function Toggle({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  return <label className="ad-toggle"><input type="checkbox" aria-label={label} checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} /><span aria-hidden="true" /></label>
}
function PageIcon({ page }: { page: string }) { const Icon = pageIcons[page] || Smartphone; return <Icon className={`ad-page-icon page-${page}`} size={21} /> }

export default function AdManagement() {
  const [config, setConfig] = useState<Configuration | null>(null)
  const [form, setForm] = useState<Placement>({ ...blank })
  const [pageFilter, setPageFilter] = useState('all')
  const [query, setQuery] = useState(''), [formatFilter, setFormatFilter] = useState('all'), [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort] = useState('order'), [pageNumber, setPageNumber] = useState(1)
  const [filterOpen, setFilterOpen] = useState(false), [sortOpen, setSortOpen] = useState(false), [pagesOpen, setPagesOpen] = useState(false)
  const [orders, setOrders] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [preview, setPreview] = useState(false)
  const [confirmation, setConfirmation] = useState<{ text: string; action: () => Promise<void> } | null>(null)
  const pages = config?.registry.pages || []
  const selectedPage = pages.find(p => p.key === form.pageKey)
  const selectedSlot = selectedPage?.slots.find(s => s.key === form.placementKey)
  const pageLabel = (key: string) => pages.find(p => p.key === key)?.label || key
  const slotLabel = (row: Placement) => pages.find(p => p.key === row.pageKey)?.slots.find(s => s.key === row.placementKey)?.label || row.placementKey

  async function request(path = '', method = 'GET', body?: unknown) {
    const response = await fetch(`${API_BASE_URL}/api/admin/ad-placements${path}`, { method, headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000) })
    const data = await response.json()
    if (response.status === 401) window.dispatchEvent(new Event('admin-session-expired'))
    if (!response.ok) throw Error(data.error || 'Could not save ad settings')
    return data
  }
  async function load() {
    try { setConfig(await request()); setOrders({}); setError('') }
    catch (e) { setError(e instanceof Error && e.name !== 'TypeError' ? e.message : 'Cannot reach the backend. Please retry.') }
  }
  useEffect(() => { void load() }, [])
  async function mutate(action: () => Promise<unknown>) {
    setBusy(true); setError(''); setNotice('')
    try { await action(); await load(); setNotice('Configuration saved. The app applies it on its next refresh.'); return true }
    catch (e) { setError((e as Error).message); return false }
    finally { setBusy(false) }
  }
  async function saveSettings(globalEnabled: boolean, pageSettings = config?.pages) {
    if (pageSettings) await mutate(() => request('/settings', 'PUT', { globalEnabled, pages: pageSettings }))
  }
  function toggleGlobal(enabled: boolean) {
    if (!config) return
    if (!enabled) setConfirmation({ text: 'Disable all ads across the app? Global OFF overrides every page and placement when the app receives the update.', action: async () => { await saveSettings(false); setConfirmation(null) } })
    else void saveSettings(true)
  }
  function resetForm() { setForm({ ...blank }); setError(''); setPreview(false) }
  async function savePlacement(event: React.FormEvent) {
    event.preventDefault()
    const unit = /^ca-app-pub-\d{16}\/\d{10}$/
    if ([form.androidAdUnitId, form.iosAdUnitId].some(id => id && !unit.test(id.trim()))) { setError('Enter a valid Ad Unit ID, with / between the publisher and unit number.'); return }
    if (form.isEnabled && !form.androidAdUnitId && !form.iosAdUnitId) { setError('Enter an Android or iOS Ad Unit ID before enabling this placement.'); return }
    if (await mutate(() => request(form.id ? `/${form.id}` : '', form.id ? 'PUT' : 'POST', form))) resetForm()
  }
  function duplicate(row: Placement) {
    const available = pages.find(p => p.key === row.pageKey)?.slots.find(s => !config?.placements.some(r => r.pageKey === row.pageKey && r.placementKey === s.key) && s.formats.includes(row.adFormat))
    setForm({ ...row, id: undefined, placementKey: available?.key || '', sortOrder: row.sortOrder + 1 })
    setError(''); setNotice('Copied into the editor. Choose an unused supported placement and save.'); setPreview(false)
  }
  async function saveOrder(row: Placement) {
    const order = Number(orders[row.id!] ?? row.sortOrder)
    if (!Number.isInteger(order) || order < 0 || order > 1000) { setError('Display order must be a whole number from 0 to 1000.'); return }
    if (order !== row.sortOrder && !busy) await mutate(() => request(`/${row.id}`, 'PUT', { ...row, sortOrder: order }))
  }
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase()
    return (config?.placements || []).filter(row =>
      (pageFilter === 'all' || row.pageKey === pageFilter) && (formatFilter === 'all' || row.adFormat === formatFilter) &&
      (statusFilter === 'all' || row.isEnabled === (statusFilter === 'enabled')) &&
      (!text || `${pageLabel(row.pageKey)} ${slotLabel(row)} ${row.pageKey} ${row.placementKey} ${row.androidAdUnitId} ${row.iosAdUnitId}`.toLowerCase().includes(text)))
      .sort((a, b) => sort === 'page' ? pageLabel(a.pageKey).localeCompare(pageLabel(b.pageKey)) || a.sortOrder - b.sortOrder : sort === 'status' ? Number(b.isEnabled) - Number(a.isEnabled) || a.sortOrder - b.sortOrder : a.sortOrder - b.sortOrder || pageLabel(a.pageKey).localeCompare(pageLabel(b.pageKey)))
  }, [config, pageFilter, query, formatFilter, statusFilter, sort])
  useEffect(() => setPageNumber(1), [pageFilter, query, formatFilter, statusFilter, sort])
  const totalPages = Math.max(1, Math.ceil(filtered.length / 8)), currentPage = Math.min(pageNumber, totalPages)
  const rows = filtered.slice((currentPage - 1) * 8, currentPage * 8)
  const activeCount = config?.placements.filter(row => config.globalEnabled && config.pages[row.pageKey] && row.isEnabled).length || 0
  const audioReward = config?.placements.find(row => row.pageKey === 'articles' && row.placementKey === 'audio_unlock' && row.adFormat === 'rewarded')
  const audioRewardStatus = !config ? '' : !config.globalEnabled ? 'Blocked: Global Ads Status is OFF. Enable it to show rewarded ads.' : !config.pages.articles ? 'Blocked: enable Articles in Page controls.' : !audioReward ? 'Not configured: create an Articles → opt-in audio reward placement.' : !audioReward.isEnabled ? 'Blocked: turn on the Articles audio reward placement.' : !audioReward.androidAdUnitId && !audioReward.iosAdUnitId ? 'Blocked: add a rewarded Ad Unit ID.' : 'Enabled. The first audio listen each day is free; further listens offer a rewarded ad on Android/iOS.'

  return <div className="ad-manager">
    <header className="ad-header"><div className="ad-heading"><Megaphone size={43} /><div><h1>Ad Management</h1><p>Manage AdMob ads for all app pages. Configure placements, Ad Unit IDs, and toggle ads as needed.</p></div></div><a className="ad-button ad-guide" href="https://developers.google.com/admob/flutter/quick-start" target="_blank" rel="noopener noreferrer"><CircleHelp size={16} /> AdMob Guide</a></header>
    {error && <div role="alert" className="ad-message ad-error">{error}<button onClick={load}>Retry</button></div>}
    {notice && <div role="status" className="ad-message ad-success">{notice}<button aria-label="Dismiss notice" onClick={() => setNotice('')}><X size={15} /></button></div>}
    <section className="ad-summary">
      <article className="ad-stat ad-global"><span className="ad-stat-icon"><Globe /></span><div><h2>Global Ads Status</h2><p>{!config ? 'Loading ad settings…' : config.globalEnabled ? 'Ads are currently enabled across the app.' : 'Ads are currently disabled across the app.'}</p></div><Toggle label="Enable Ads Globally" checked={config?.globalEnabled || false} disabled={busy || !config} onChange={toggleGlobal} /></article>
      <article className="ad-stat"><span className="ad-stat-icon"><Smartphone /></span><div><strong>{pages.length}</strong><p>App Pages</p><small><Eye size={10} /> Registered</small></div></article>
      <article className="ad-stat"><span className="ad-stat-icon"><Layers /></span><div><strong>{config?.placements.length || 0}</strong><p>Ad Placements</p><small>○ Configured</small></div></article>
      <article className="ad-stat"><span className="ad-stat-icon ad-icon-active"><Check /></span><div><strong>{activeCount}</strong><p>Active Ads</p><small className="ad-enabled">○ Enabled</small></div></article>
      <article className="ad-stat"><span className="ad-stat-icon ad-icon-inactive"><Pause /></span><div><strong>{(config?.placements.length || 0) - activeCount}</strong><p>Inactive Ads</p><small className="ad-disabled">○ Disabled</small></div></article>
    </section>
    {config && <div role="status" className="ad-message"><strong>Blog audio reward: </strong>{audioRewardStatus}</div>}
    <nav className="ad-tabs" aria-label="Ad page filters"><button className={pageFilter === 'all' ? 'selected' : ''} onClick={() => setPageFilter('all')}><LayoutGrid size={18} /> All Pages</button>{pages.map(page => <button key={page.key} className={pageFilter === page.key ? 'selected' : ''} onClick={() => setPageFilter(page.key)}><PageIcon page={page.key} />{page.label}</button>)}</nav>
    <div className="ad-workspace">
      <section className="ad-table-panel">
        <div className="ad-table-toolbar"><h2>Ad Placements <span>{filtered.length}</span></h2><div className="ad-tools"><label className="ad-search"><Search size={17} /><input aria-label="Search pages or placements" placeholder="Search pages or placements…" value={query} onChange={e => setQuery(e.target.value)} /></label><button className={`ad-button ${filterOpen ? 'ad-tool-selected' : ''}`} aria-expanded={filterOpen} onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false) }}><SlidersHorizontal size={15} /> Filter</button><div className="ad-sort-wrap"><button className="ad-button" aria-expanded={sortOpen} onClick={() => { setSortOpen(!sortOpen); setFilterOpen(false) }}><ArrowDownUp size={15} /> Sort</button>{sortOpen && <div className="ad-sort-menu">{[['order', 'Display order'], ['page', 'Page name'], ['status', 'Enabled first']].map(([key, label]) => <button key={key} className={sort === key ? 'current' : ''} onClick={() => { setSort(key); setSortOpen(false) }}>{label}{sort === key && <Check size={14} />}</button>)}</div>}</div></div></div>
        {filterOpen && <div className="ad-filter-bar"><label>Ad type<select aria-label="Filter ad type" value={formatFilter} onChange={e => setFormatFilter(e.target.value)}><option value="all">All formats</option>{Object.entries(formatNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Status<select aria-label="Filter status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All placements</option><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select></label><button className="ad-button" onClick={() => { setFormatFilter('all'); setStatusFilter('all'); setQuery('') }}>Clear filters</button></div>}
        <div className="ad-page-controls"><button aria-expanded={pagesOpen} onClick={() => setPagesOpen(!pagesOpen)}><SlidersHorizontal size={13} /> Page controls</button>{pageFilter !== 'all' && config && <span>{pageLabel(pageFilter)} ads <Toggle label={`${pageLabel(pageFilter)} ads`} checked={config.pages[pageFilter] === true} disabled={busy} onChange={value => void saveSettings(config.globalEnabled, { ...config.pages, [pageFilter]: value })} /></span>}</div>
        {pagesOpen && config && <div className="ad-page-switches">{pages.map(page => <div key={page.key}><PageIcon page={page.key} /><span>{page.label}</span>{pageFilter !== page.key && <Toggle label={`${page.label} ads`} checked={config.pages[page.key] === true} disabled={busy} onChange={value => void saveSettings(config.globalEnabled, { ...config.pages, [page.key]: value })} />}</div>)}<button className="ad-button" disabled={busy} onClick={() => void saveSettings(config.globalEnabled)}>Save Changes</button></div>}
        <div className="ad-table-scroll"><table><thead><tr><th>Page</th><th>Placement</th><th>Ad Type</th><th>Android Ad Unit ID</th><th>iOS Ad Unit ID</th><th>Status</th><th>Order</th><th>Actions</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} data-testid="ad-placement-row"><td><div className="ad-page-cell"><PageIcon page={row.pageKey} /><span>{pageLabel(row.pageKey)}</span></div></td><td><div className="ad-placement-cell"><MapPin size={12} /><div><strong>{slotLabel(row)}</strong><small>{row.adFormat === 'interstitial' ? `After swipes · ${row.frequencyCap}s cap` : row.adFormat === 'rewarded' ? 'User-initiated reward' : row.placementKey === 'between_cards' ? 'Between cards' : 'Registered page slot'}</small></div></div></td><td><span className={`ad-format format-${row.adFormat}`}>{formatNames[row.adFormat]}</span></td><td><span className="ad-unit" title={row.androidAdUnitId}>{row.androidAdUnitId || 'Not configured'}</span></td><td><span className="ad-unit" title={row.iosAdUnitId}>{row.iosAdUnitId || 'Not configured'}</span></td><td><Toggle label={`${row.pageKey} ${row.placementKey} enabled`} checked={row.isEnabled} disabled={busy} onChange={value => void mutate(() => request(`/${row.id}/status`, 'PATCH', { isEnabled: value }))} />{config && (!config.globalEnabled || !config.pages[row.pageKey]) && <small className="ad-blocked">{!config.globalEnabled ? 'Global OFF' : 'Page OFF'}</small>}</td><td><input className="ad-order" aria-label={`Order for ${row.pageKey} ${row.placementKey}`} type="number" min={0} max={1000} disabled={busy} value={orders[row.id!] ?? row.sortOrder} onChange={e => setOrders({ ...orders, [row.id!]: e.target.value })} onBlur={() => void saveOrder(row)} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} /></td><td><div className="ad-actions"><button className="ad-icon-button" aria-label="Edit" title={`Edit ${slotLabel(row)}`} disabled={busy} onClick={() => { setForm({ ...row }); setError(''); setPreview(false) }}><Pencil size={14} /></button><button className="ad-icon-button" aria-label={`Duplicate ${row.pageKey} ${row.placementKey}`} title="Duplicate into a new slot" disabled={busy} onClick={() => duplicate(row)}><Copy size={14} /></button><button className="ad-icon-button ad-delete" aria-label="Delete" title="Delete configuration" disabled={busy} onClick={() => setConfirmation({ text: 'Delete this ad configuration? The app will stop displaying ads in this slot after its next refresh.', action: async () => { if (await mutate(() => request(`/${row.id}`, 'DELETE'))) { if (form.id === row.id) resetForm(); setConfirmation(null) } } })}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>
        {!config && <div className="ad-empty">{error ? 'Configuration unavailable. Use Retry above.' : 'Loading ad configuration…'}</div>}{config && !rows.length && <div className="ad-empty"><Layers size={28} /><p>No placements match this view.</p><button className="ad-button" onClick={resetForm}>New Configuration</button></div>}
        <footer className="ad-table-footer"><span>Showing {filtered.length ? (currentPage - 1) * 8 + 1 : 0} to {Math.min(currentPage * 8, filtered.length)} of {filtered.length} placements</span><div className="ad-pagination"><button aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPageNumber(currentPage - 1)}><ChevronLeft size={17} /></button>{Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1).map(n => <button key={n} aria-label={`Page ${n}`} aria-current={n === currentPage ? 'page' : undefined} onClick={() => setPageNumber(n)}>{n}</button>)}<button aria-label="Next page" disabled={currentPage >= totalPages} onClick={() => setPageNumber(currentPage + 1)}><ChevronRight size={17} /></button></div></footer>
      </section>
      <aside className="ad-editor"><div className="ad-editor-title"><span><Plus size={25} /></span><div><h2>{form.id ? 'Edit Ad Placement' : 'Create New Ad'}</h2><p>{form.id ? 'Update this placement’s configuration.' : 'Add a new ad placement for any page.'}</p></div></div><button className="ad-new-link" onClick={resetForm}>New Configuration</button>
        <form onSubmit={savePlacement}>
          <label>App Page <em>*</em><select aria-label="Page" required disabled={!config || busy} value={form.pageKey} onChange={e => setForm({ ...form, pageKey: e.target.value, placementKey: '', adFormat: 'banner' })}><option value="">Select page</option>{pages.map(page => <option key={page.key} value={page.key}>{page.label}</option>)}</select><small>Select the page where the ad will be shown</small></label>
          <label>Ad Placement <em>*</em><select aria-label="Placement" required disabled={!selectedPage || busy} value={form.placementKey} onChange={e => { const slot = selectedPage?.slots.find(s => s.key === e.target.value); setForm({ ...form, placementKey: e.target.value, adFormat: slot?.formats[0] || 'banner' }) }}><option value="">Select supported placement</option>{selectedPage?.slots.map(slot => <option key={slot.key} value={slot.key}>{slot.label}</option>)}</select><small>Position of the ad on the page</small></label>
          <label>Ad Format <em>*</em><select aria-label="Ad Format" required disabled={!selectedSlot || busy} value={selectedSlot ? form.adFormat : ''} onChange={e => setForm({ ...form, adFormat: e.target.value as Format })}>{!selectedSlot && <option value="">Select a placement first</option>}{selectedSlot?.formats.map(format => <option key={format} value={format}>{formatNames[format]} Ad</option>)}</select><small>Supported type of ad format</small></label>
          <div className="ad-editor-columns">{(['androidAdUnitId', 'iosAdUnitId'] as const).map((field, index) => <label key={field}>{index === 0 ? 'Android' : 'iOS'} Ad Unit ID<input aria-label={index === 0 ? 'Android Ad Unit ID' : 'iOS Ad Unit ID'} disabled={busy} placeholder="ca-app-pub-…/…" value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value.trim() })} /></label>)}</div>
          <div className="ad-editor-columns ad-order-field"><label>Display Order<input aria-label="Display Order" required disabled={busy} type="number" min={0} max={1000} value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} /></label><small>Lower number shows first where ordering is supported</small></div>
          {form.adFormat === 'interstitial' && <label>Minimum seconds between ads<input aria-label="Frequency cap" required type="number" min={60} max={86400} value={form.frequencyCap} onChange={e => setForm({ ...form, frequencyCap: Number(e.target.value) })} /><small>Also limited to every five article swipes.</small></label>}
          <div className="ad-editor-enable"><Toggle label="Placement enabled" checked={form.isEnabled} disabled={busy} onChange={value => setForm({ ...form, isEnabled: value })} /><div><strong>Enable this ad placement</strong><small>Turn off to hide this specific ad</small></div></div>
          <div className="ad-preview-heading"><strong>Ad Preview <CircleHelp size={13} /></strong><button type="button" className="ad-test-button" onClick={() => setPreview(true)}><Eye size={13} /> Test Ad</button></div>
          <div className={`ad-sample sample-${form.adFormat}`}><span>Sample {formatNames[form.adFormat]} Ad</span><small>{form.adFormat === 'banner' ? '320 × 50 · Preview only' : 'Preview only'}</small></div>
          <div className="ad-editor-buttons"><button type="button" className="ad-button" disabled={busy} onClick={resetForm}>Cancel</button><button className="ad-button ad-primary" disabled={busy || !config}><Save size={16} />{busy ? 'Saving…' : 'Save Configuration'}</button></div>
        </form>
      </aside>
    </div>
    {confirmation && <div className="ad-modal-backdrop"><div role="dialog" aria-modal="true" aria-label="Confirm ad change" className="ad-modal"><h2>Confirm change</h2><p>{confirmation.text}</p><div className="ad-modal-buttons"><button disabled={busy} className="ad-button" onClick={() => setConfirmation(null)}>Cancel</button><button disabled={busy} className="ad-button ad-danger" onClick={confirmation.action}>Confirm</button></div></div></div>}
    {preview && <div className="ad-modal-backdrop"><div role="dialog" aria-modal="true" aria-label="Test ad preview" className="ad-modal"><div className="ad-preview-heading"><h2>Test Ad Preview</h2><button className="ad-icon-button" aria-label="Close preview" onClick={() => setPreview(false)}><X size={18} /></button></div><div className={`ad-sample ad-sample-large sample-${form.adFormat}`}><span>Sample {formatNames[form.adFormat]} Ad</span>{form.adFormat === 'native' && <p>Sample sponsored content · AdChoices</p>}{form.adFormat === 'rewarded' && <p>Opt-in reward preview</p>}</div><p>This browser preview does not request a live ad. To verify actual rendering, use the Flutter app with Google’s test Ad Unit IDs.</p><label>Android test unit<code>{testIds.android[form.adFormat]}</code></label><label>iOS test unit<code>{testIds.ios[form.adFormat]}</code></label></div></div>}
  </div>
}
