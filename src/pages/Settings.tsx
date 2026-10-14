import { useEffect, useState } from 'react'
import { Save, Image, FileText, Shield, Smartphone, Bell, Link, Quote, Mail, Pencil, Check, Search, RefreshCw, Loader2, AlertTriangle } from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL } from '../utils/api'
import { ImageUploader } from '../components/ImageUploader'
import NotificationIconPicker, { parseNotificationIcon } from '../components/NotificationIconPicker'

const api = axios.create({ baseURL: `${API_BASE_URL}/api/admin` })
const groups = ['Brand', 'Content', 'Legal', 'Advertising'] as const
type Group = typeof groups[number]
type Item = { key: string; ta: string; en: string }
type Setting = { key: string; label: string; group: Group; icon: typeof Image; kind?: 'image' | 'single' | 'toggle'; options?: { value: string; label: string }[] }
const settings: Setting[] = [
  { key: 'app_name', label: 'App name', group: 'Brand', icon: Smartphone },
  { key: 'app_logo_url', label: 'App logo', group: 'Brand', icon: Image, kind: 'image' },
  { key: 'launcher_shortcut_image', label: 'Custom home-screen shortcut image', group: 'Brand', icon: Image, kind: 'image' },
  { key: 'launcher_icon', label: 'Android Home-screen Icon', group: 'Brand', icon: Smartphone, options: [{ value: 'default', label: 'Original logo' }, { value: 'emerald', label: 'Logo with emerald frame' }, { value: 'gold', label: 'Logo with gold frame' }, { value: 'blue', label: 'Logo with blue frame' }, { value: 'purple', label: 'Logo with purple frame' }, { value: 'red', label: 'Logo with red frame' }, { value: 'pink', label: 'Logo with pink frame' }, { value: 'orange', label: 'Logo with orange frame' }, { value: 'teal', label: 'Logo with teal frame' }, { value: 'black', label: 'Logo with black frame' }, { value: 'white', label: 'Logo with white frame' }] },
  { key: 'notification_icon', label: 'Android Notification-bar Icon', group: 'Brand', icon: Bell, options: [{ value: 'ic_notification', label: 'Original icon' }, { value: 'ic_notification_star', label: 'Star' }, { value: 'ic_notification_compass', label: 'Compass' }] },
  { key: 'app_share_link', label: 'App download link', group: 'Brand', icon: Link, kind: 'single' },
  { key: 'god_quote', label: 'Divine quotes', group: 'Content', icon: Quote },
  { key: 'contact_us', label: 'Contact us', group: 'Content', icon: Mail },
  { key: 'terms_and_conditions', label: 'Terms & Conditions', group: 'Legal', icon: FileText },
  { key: 'privacy_policy', label: 'Privacy Policy', group: 'Legal', icon: Shield },
  { key: 'Disclaimer', label: 'App Disclaimer', group: 'Legal', icon: AlertTriangle },
  { key: 'adsense_enabled', label: 'AdSense enabled', group: 'Advertising', icon: Shield, kind: 'toggle' },
  { key: 'adsense_unit_id', label: 'AdSense unit ID', group: 'Advertising', icon: FileText, kind: 'single' },
  { key: 'admob_enabled', label: 'AdMob enabled', group: 'Advertising', icon: Shield, kind: 'toggle' },
  ...['banner', 'rewarded', 'interstitial'].map(type => ({ key: `admob_${type}_unit_id`, label: `AdMob ${type} unit ID`, group: 'Advertising' as Group, icon: FileText, kind: 'single' as const })),
]

export default function Settings() {
  const [content, setContent] = useState<Item[]>([])
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const [group, setGroup] = useState<Group>('Brand'), [query, setQuery] = useState('')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [form, setForm] = useState({ ta: '', en: '' })
  const [error, setError] = useState(''), [notice, setNotice] = useState('')
  async function load() {
    setLoading(true); setError('')
    try { const { data } = await api.get('/app-content'); setContent(data) }
    catch { setError('Could not load settings. Please retry.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  function edit(setting: Setting, item: Item) {
    if (uploadingIcon || saving) return;
    const fallback = setting.options?.[0].value || (setting.kind === 'toggle' ? 'false' : '')
    setEditingKey(setting.key); setForm({ ta: item.ta || fallback, en: item.en || fallback }); setNotice(''); setError('')
  }
  async function save(key: string) {
    if (uploadingIcon || saving) return;
    setSaving(true); setError('')
    try {
      await api.put('/app-content', { key, ...form }, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } })
      setContent(previous => [...previous.filter(item => item.key !== key), { key, ...form }])
      setEditingKey(null); setNotice('Changes saved and published.')
    } catch { setError('Could not save changes. Please retry.') }
    finally { setSaving(false) }
  }
  const visible = settings.filter(setting => query.trim() ? setting.label.toLowerCase().includes(query.toLowerCase().trim()) : setting.group === group)
  return <div className="space-y-6">
    <header className="flex items-center justify-between gap-4"><div><p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">System preferences</p><h2 className="font-semibold">App settings</h2></div><button className="icon-button" title="Refresh settings" aria-label="Refresh settings" disabled={loading || saving} onClick={() => void load()}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button></header>
    <div className="settings-tabs" role="tablist" aria-label="Settings categories">{groups.map(value => <button role="tab" key={value} aria-selected={group === value && !query} onClick={() => { setGroup(value); setQuery('') }}>{value}</button>)}</div>
    <div className="flex flex-wrap justify-between items-center gap-4"><div><h3 className="text-sm font-semibold">{query ? 'Search results' : group === 'Brand' ? 'App identity' : group === 'Legal' ? 'Policies & terms' : group === 'Advertising' ? 'Advertising settings' : 'App content'}</h3><p className="text-[11px] text-gray-500 mt-1">{visible.length} settings</p></div><label className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2 bg-white w-full sm:w-64"><Search size={15} className="text-gray-400" /><input aria-label="Search settings" placeholder="Search settings" value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 w-full border-0 outline-none text-xs" /></label></div>
    {error && <p role="alert" className="text-sm text-rose-700 bg-rose-50 rounded-md p-3">{error}</p>}
    {notice && <p role="status" className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-md p-3"><Check size={16} />{notice}</p>}
    {loading ? <div role="status" className="flex gap-2 items-center py-16 justify-center text-sm text-gray-500"><Loader2 size={18} className="animate-spin" />Loading settings</div> : <div className="settings-list">{visible.length === 0 && <p className="p-8 text-sm text-gray-500">No matching settings.</p>}{visible.map(setting => {
      const item = content.find(value => value.key === setting.key) || { key: setting.key, ta: '', en: '' }
      const value = item.en || item.ta
      const Icon = setting.icon
      const editing = editingKey === setting.key
      const customIcon = setting.key === 'notification_icon' ? parseNotificationIcon(value) : null
      return <section key={setting.key} className="setting-row" aria-label={setting.label}>
        <div className="setting-summary"><h3 className="setting-label"><Icon /><span>{setting.label}</span></h3><div className="setting-value">{customIcon ? <div className="flex items-center gap-3"><div className="notification-icon-preview"><img src={`${API_BASE_URL}${customIcon.imageUrl}`} alt="Selected notification icon" /></div>{customIcon.label}</div> : setting.options ? setting.options.find(option => option.value === value)?.label || setting.options[0].label : setting.kind === 'toggle' ? <span className={`inline-flex items-center gap-2 ${value === 'true' ? 'text-emerald-700' : 'text-gray-500'}`}><span className={`w-1.5 h-1.5 rounded-full ${value === 'true' ? 'bg-emerald-500' : 'bg-gray-400'}`} />{value === 'true' ? 'Enabled' : 'Disabled'}</span> : setting.kind === 'image' && value ? <div className="setting-preview"><img src={value.startsWith('/') ? `${API_BASE_URL}${value}` : value} alt={setting.label} /><span className="min-w-0 break-all">{value}</span></div> : <span className="line-clamp-2">{value || 'Not configured'}</span>}</div><button className="icon-button" title={`Edit ${setting.label}`} aria-label={`Edit ${setting.label}`} disabled={saving || uploadingIcon} onClick={() => edit(setting, item)}><Pencil size={15} /></button></div>
        {editing && <form className="setting-editor" onSubmit={e => { e.preventDefault(); void save(setting.key) }}>
          {setting.key === 'notification_icon' ? <NotificationIconPicker value={form.en} onChange={value => setForm({ ta: value, en: value })} onBusy={setUploadingIcon} /> : setting.options ? <label>{setting.label}<select aria-label={setting.label} value={form.en} onChange={e => setForm({ ta: e.target.value, en: e.target.value })}>{setting.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label> : setting.kind === 'image' ? <div><ImageUploader label={setting.label} value={form.en || form.ta} onChange={url => setForm({ ta: url, en: url })} onBusy={setUploadingIcon} rasterOnly={setting.key === 'launcher_shortcut_image'} folder="app_settings" />{setting.key === 'launcher_shortcut_image' && <p className="text-xs text-gray-500 mt-3">Upload a square PNG, JPG or WebP image. Users can add it from the app menu using Add to home screen. This creates a separate shortcut and requires approval on their phone.</p>}</div> : setting.kind === 'toggle' ? <label className="flex items-center gap-2"><input type="checkbox" checked={form.en === 'true'} onChange={e => setForm({ ta: String(e.target.checked), en: String(e.target.checked) })} />Enabled</label> : setting.kind === 'single' ? <label>Value<input value={form.en} onChange={e => setForm({ ta: e.target.value, en: e.target.value })} /></label> : <div className="grid sm:grid-cols-2 gap-5"><label>Tamil<textarea value={form.ta} onChange={e => setForm({ ...form, ta: e.target.value })} /></label><label>English<textarea value={form.en} onChange={e => setForm({ ...form, en: e.target.value })} /></label></div>}
          <div className="flex justify-end gap-2 mt-5"><button type="button" className="secondary-button" disabled={saving || uploadingIcon} onClick={() => setEditingKey(null)}>Cancel</button><button className="primary-button" disabled={saving || uploadingIcon}>{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}{saving ? 'Saving' : 'Save & publish'}</button></div>
        </form>}
      </section>
    })}</div>}
  </div>
}
