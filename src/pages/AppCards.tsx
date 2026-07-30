import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X, Image, Eye, EyeOff, Sparkles } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'
import { ImageUploader } from '../components/ImageUploader'

const api = {
  get: (url: string) => fetch(`${API_BASE_URL}/api/admin${url}`, { headers: { Authorization: 'Bearer ' + localStorage.getItem('adminToken') } }).then(r => r.json()),
  post: (url: string, body: any) => fetch(`${API_BASE_URL}/api/admin${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('adminToken') }, body: JSON.stringify(body) }).then(r => r.json()),
  put: (url: string, body: any) => fetch(`${API_BASE_URL}/api/admin${url}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('adminToken') }, body: JSON.stringify(body) }).then(r => r.json()),
  delete: (url: string) => fetch(`${API_BASE_URL}/api/admin${url}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + localStorage.getItem('adminToken') } }).then(r => r.json()),
}

const SCREEN_OPTIONS = [
  { value: 'panchangam', label: 'Panchangam' },
  { value: 'nalla_neram', label: 'Nalla Neram' },
  { value: 'mugurtham', label: 'Mugurtha Naal' },
  { value: 'daily_palan', label: 'Daily Rasi Palan' },
  { value: 'weekly_palan', label: 'Weekly Rasi Palan' },
  { value: 'monthly_palan', label: 'Monthly Rasi Palan' },
  { value: 'yearly_palan', label: 'Yearly Rasi Palan' },
  { value: 'ai_jothidar', label: 'AI Jothidar' },
  { value: 'festivals', label: 'Festivals' },
  { value: 'naal_kati', label: 'Naal Kati' },
]

const emptyCard = { key: '', titleTa: '', titleEn: '', imageUrl: '', isEnabled: true, order: 0, screen: 'panchangam' }

const AppCards = () => {
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [form, setForm] = useState({ ...emptyCard })

  useEffect(() => { fetchCards() }, [])

  const fetchCards = async () => {
    try {
      const data = await api.get('/app-cards')
      setCards(Array.isArray(data) ? data.sort((a: any, b: any) => a.order - b.order) : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    try {
      if (editingId) {
        await api.post('/app-cards', { id: editingId, ...form })
      } else {
        await api.post('/app-cards', form)
      }
      setEditingId(null)
      setIsAdding(false)
      setForm({ ...emptyCard })
      fetchCards()
    } catch (e) { alert('Failed to save card') }
  }

  const handleEdit = (card: any) => {
    setEditingId(card.id)
    setForm({ key: card.key, titleTa: card.titleTa, titleEn: card.titleEn, imageUrl: card.imageUrl || '', isEnabled: card.isEnabled, order: card.order, screen: card.screen })
    setIsAdding(false)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this card?')) return
    await api.delete(`/app-cards/${id}`)
    fetchCards()
  }

  const handleToggle = async (card: any) => {
    await api.post('/app-cards', { id: card.id, ...card, isEnabled: !card.isEnabled })
    fetchCards()
  }

  return (
    <div className="font-['Inter']">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-astrology-gold font-['Outfit'] flex items-center gap-2">
            <Sparkles className="text-astrology-gold" size={28} />
            App Cards Manager
          </h2>
          <p className="text-gray-400 text-sm">Manage the feature cards shown on the home screen. Changes reflect live in the app.</p>
        </div>
        <button onClick={() => { setIsAdding(true); setEditingId(null); setForm({ ...emptyCard }) }}
          className="bg-astrology-gold text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-astrology-gold/20 hover:opacity-90 transition-opacity">
          <Plus size={18} /> Add New Card
        </button>
      </header>

      {/* Inline Form Panel to avoid component remount on keystroke */}
      {(isAdding || editingId) && (
        <div className="mb-8 bg-astrology-card border border-astrology-gold/30 rounded-xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-astrology-gold font-['Outfit']">{editingId ? 'Edit Card' : 'Add New Card'}</h3>
            <button onClick={() => { setEditingId(null); setIsAdding(false); setForm({ ...emptyCard }) }} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!editingId && (
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1 font-semibold">Unique Key (e.g. my_feature)</label>
                  <input 
                    placeholder="my_feature" 
                    value={form.key}
                    onChange={e => setForm({ ...form, key: e.target.value })}
                    className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-astrology-gold" 
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-semibold">Tamil Title</label>
                <input 
                  placeholder="தமிழ் தலைப்பு" 
                  value={form.titleTa}
                  onChange={e => setForm({ ...form, titleTa: e.target.value })}
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-astrology-gold" 
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-semibold">English Title</label>
                <input 
                  placeholder="English Title" 
                  value={form.titleEn}
                  onChange={e => setForm({ ...form, titleEn: e.target.value })}
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-astrology-gold" 
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <ImageUploader 
                  label="App Card Image"
                  value={form.imageUrl}
                  onChange={url => setForm({ ...form, imageUrl: url })}
                  folder="app_cards"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-semibold">Target Screen</label>
                <select 
                  value={form.screen} 
                  onChange={e => setForm({ ...form, screen: e.target.value })}
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-astrology-gold">
                  {SCREEN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 font-semibold">Order Index (0 = first)</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={form.order}
                  onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-astrology-gold" 
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer pt-4">
                  <input 
                    type="checkbox" 
                    checked={form.isEnabled} 
                    onChange={e => setForm({ ...form, isEnabled: e.target.checked })} 
                    className="w-4 h-4 accent-astrology-gold"
                  />
                  <span className="text-sm text-gray-300 font-semibold">Enabled in app</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button type="submit" className="bg-astrology-gold text-black px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:opacity-90">
                <Save size={16} /> Save Card
              </button>
              <button type="button" onClick={() => { setEditingId(null); setIsAdding(false); setForm({ ...emptyCard }) }} className="bg-white/10 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-white/20 flex items-center gap-2">
                <X size={16} /> Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-astrology-card rounded-xl border border-astrology-gold/10 overflow-x-auto shadow-2xl">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-black/30 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Order</th>
              <th className="px-6 py-4">Image</th>
              <th className="px-6 py-4">Tamil Title</th>
              <th className="px-6 py-4">English Title</th>
              <th className="px-6 py-4">Screen</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading cards...</td></tr>
            ) : cards.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No cards yet. Add one above.</td></tr>
            ) : cards.map(card => (
              <tr key={card.id || card.key} className={`hover:bg-white/5 transition-colors ${!card.isEnabled ? 'opacity-50' : ''}`}>
                <td className="px-6 py-4 text-gray-400 font-mono text-sm">{card.order}</td>
                <td className="px-6 py-4">
                  {card.imageUrl
                    ? <img src={card.imageUrl} alt="" className="h-10 w-14 object-cover rounded-lg border border-white/10" onError={e => (e.currentTarget.style.display='none')} />
                    : <div className="h-10 w-14 bg-white/5 rounded-lg flex items-center justify-center"><Image size={16} className="text-gray-600" /></div>
                  }
                </td>
                <td className="px-6 py-4 font-bold text-astrology-gold">{card.titleTa}</td>
                <td className="px-6 py-4 text-gray-200">{card.titleEn}</td>
                <td className="px-6 py-4"><span className="text-xs bg-white/10 px-2 py-1 rounded font-mono">{card.screen}</span></td>
                <td className="px-6 py-4">
                  <button onClick={() => handleToggle(card)} className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${card.isEnabled ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {card.isEnabled ? <><Eye size={12} /> On</> : <><EyeOff size={12} /> Off</>}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-3 text-gray-400">
                    <button onClick={() => handleEdit(card)} className="hover:text-astrology-gold transition-colors" title="Edit"><Edit2 size={16} /></button>
                    {card.id && <button onClick={() => handleDelete(card.id)} className="hover:text-red-400 transition-colors" title="Delete"><Trash2 size={16} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AppCards
