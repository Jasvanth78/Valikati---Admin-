import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Calendar as CalendarIcon, Sun, Moon, Sparkles, Clock, AlertTriangle } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'

interface PanchangamEntry {
  id?: string
  date: string
  sunrise: string
  sunset: string
  tithi?: string
  nakshatram?: string
  yogam?: string
  karanam?: string
  details?: string
  nallaNeram?: string
  gowriNallaNeram?: string
  rahuKalam?: string
  yemagandam?: string
  kuligai?: string
}

const emptyForm: PanchangamEntry = {
  date: new Date().toISOString().split('T')[0],
  sunrise: '06:00 AM',
  sunset: '06:00 PM',
  tithi: '',
  nakshatram: '',
  yogam: '',
  karanam: '',
  details: '',
  nallaNeram: '',
  gowriNallaNeram: '',
  rahuKalam: '',
  yemagandam: '',
  kuligai: ''
}

const Panchangam = () => {
  const [entries, setEntries] = useState<PanchangamEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<PanchangamEntry>(emptyForm)

  useEffect(() => {
    fetchPanchangam()
  }, [])

  const fetchPanchangam = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/panchangam`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error('Error fetching panchangam:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setEditingId(null)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      sunrise: '06:00 AM',
      sunset: '06:00 PM',
      tithi: 'வளர்பிறை பிரதமை',
      nakshatram: 'உத்திராடம்',
      yogam: 'சுபம்',
      karanam: 'பவம்',
      details: '',
      nallaNeram: '09:15 AM - 10:15 AM | 04:45 PM - 05:45 PM',
      gowriNallaNeram: '10:30 AM - 11:30 AM',
      rahuKalam: '01:30 PM - 03:00 PM',
      yemagandam: '06:00 AM - 07:30 AM',
      kuligai: '09:00 AM - 10:30 AM'
    })
    setIsFormOpen(true)
  }

  const handleOpenEdit = (entry: PanchangamEntry) => {
    setEditingId(entry.id || null)
    let formattedDate = entry.date
    if (entry.date && entry.date.includes('T')) {
      formattedDate = entry.date.split('T')[0]
    }
    setFormData({
      id: entry.id,
      date: formattedDate,
      sunrise: entry.sunrise || '06:00 AM',
      sunset: entry.sunset || '06:00 PM',
      tithi: entry.tithi || '',
      nakshatram: entry.nakshatram || '',
      yogam: entry.yogam || '',
      karanam: entry.karanam || '',
      details: entry.details || '',
      nallaNeram: entry.nallaNeram || '',
      gowriNallaNeram: entry.gowriNallaNeram || '',
      rahuKalam: entry.rahuKalam || '',
      yemagandam: entry.yemagandam || '',
      kuligai: entry.kuligai || ''
    })
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const isEdit = Boolean(editingId)
      const url = isEdit
        ? `${API_BASE_URL}/api/admin/panchangam/${editingId}`
        : `${API_BASE_URL}/api/admin/panchangam`
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsFormOpen(false)
        setEditingId(null)
        setFormData(emptyForm)
        fetchPanchangam()
      }
    } catch (error) {
      console.error('Error saving panchangam entry:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Panchangam entry?')) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/panchangam/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
      if (response.ok) {
        fetchPanchangam()
      }
    } catch (error) {
      console.error('Error deleting panchangam entry:', error)
    }
  }

  return (
    <div className="font-['Inter']">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 font-['Outfit']">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-astrology-gold">Panchangam Management (பஞ்சாங்கம்)</h2>
          <p className="text-gray-400 text-sm md:text-base font-['Inter']">Manage daily Sunrise, Sunset, Tithi, Nakshatram, Auspicious & Inauspicious timings.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="btn-gold flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <Plus size={18} />
          New Entry
        </button>
      </header>

      {isFormOpen && (
        <div className="mb-8 bg-astrology-card p-6 rounded-xl border border-astrology-gold/30 shadow-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h3 className="text-xl font-bold text-astrology-gold font-['Outfit']">
              {editingId ? 'Edit Panchangam Details' : 'Add New Panchangam Entry'}
            </h3>
            <button 
              type="button" 
              onClick={() => setIsFormOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Top row: Date, Sunrise, Sunset */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-astrology-gold mb-1 font-bold">Date</label>
                <input 
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-orange-400 mb-1 font-bold">Sunrise (சூரியோதயம்)</label>
                <input 
                  type="text"
                  placeholder="e.g. 06:00 AM"
                  value={formData.sunrise}
                  onChange={(e) => setFormData({...formData, sunrise: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-blue-400 mb-1 font-bold">Sunset (சூரியாஸ்தமனம்)</label>
                <input 
                  type="text"
                  placeholder="e.g. 06:00 PM"
                  value={formData.sunset}
                  onChange={(e) => setFormData({...formData, sunset: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  required
                />
              </div>
            </div>

            {/* Thithi & Nakshatram Section */}
            <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
              <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} />
                திதி & நட்சத்திரம் (Tithi, Star, Yogam & Karanam)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Tithi (திதி)</label>
                  <input 
                    type="text"
                    placeholder="e.g. வளர்பிறை பிரதமை"
                    value={formData.tithi || ''}
                    onChange={(e) => setFormData({...formData, tithi: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Nakshatram (நட்சத்திரம்)</label>
                  <input 
                    type="text"
                    placeholder="e.g. உத்திராடம்"
                    value={formData.nakshatram || ''}
                    onChange={(e) => setFormData({...formData, nakshatram: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Yogam (யோகம்)</label>
                  <input 
                    type="text"
                    placeholder="e.g. சுபம்"
                    value={formData.yogam || ''}
                    onChange={(e) => setFormData({...formData, yogam: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Karanam (கரணம்)</label>
                  <input 
                    type="text"
                    placeholder="e.g. பவம்"
                    value={formData.karanam || ''}
                    onChange={(e) => setFormData({...formData, karanam: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Auspicious Times Section */}
            <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
              <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} />
                சுப நேரங்கள் (Auspicious Timings)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Nalla Neram (நல்ல நேரம்)</label>
                  <input 
                    type="text"
                    placeholder="e.g. 09:15 AM - 10:15 AM | 04:45 PM - 05:45 PM"
                    value={formData.nallaNeram || ''}
                    onChange={(e) => setFormData({...formData, nallaNeram: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Gowri Nalla Neram (கௌரி நல்ல நேரம்)</label>
                  <input 
                    type="text"
                    placeholder="e.g. 10:30 AM - 11:30 AM"
                    value={formData.gowriNallaNeram || ''}
                    onChange={(e) => setFormData({...formData, gowriNallaNeram: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Inauspicious Times Section */}
            <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
              <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={16} />
                ராகு காலம் & எமகண்டம் (Inauspicious Times)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Rahu Kalam (ராகு காலம்)</label>
                  <input 
                    type="text"
                    placeholder="e.g. 01:30 PM - 03:00 PM"
                    value={formData.rahuKalam || ''}
                    onChange={(e) => setFormData({...formData, rahuKalam: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Yemagandam (எமகண்டம்)</label>
                  <input 
                    type="text"
                    placeholder="e.g. 06:00 AM - 07:30 AM"
                    value={formData.yemagandam || ''}
                    onChange={(e) => setFormData({...formData, yemagandam: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Kuligai (குளிகை)</label>
                  <input 
                    type="text"
                    placeholder="e.g. 09:00 AM - 10:30 AM"
                    value={formData.kuligai || ''}
                    onChange={(e) => setFormData({...formData, kuligai: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* General Details Notes */}
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-bold">Additional Details / Summary (விவரங்கள்)</label>
              <textarea 
                placeholder="Additional notes or astronomical summary..."
                value={formData.details || ''}
                onChange={(e) => setFormData({...formData, details: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none min-h-[60px]"
              ></textarea>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-6 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-sm font-bold text-gray-400"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-gold px-8 py-2 rounded-lg text-sm font-bold"
              >
                {editingId ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading panchangam data...</div>
        ) : entries.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No panchangam entries found.</div>
        ) : entries.map(entry => (
          <div key={entry.id} className="bg-astrology-card p-6 rounded-xl border border-astrology-gold/10 hover:border-astrology-gold/30 transition-all shadow-xl flex flex-col md:flex-row gap-6">
            <div className="flex items-center gap-4 border-r border-white/5 pr-6 min-w-[180px]">
              <div className="p-3 bg-astrology-gold/10 rounded-full">
                <CalendarIcon className="text-astrology-gold" size={24} />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Date</div>
                <div className="text-lg font-bold text-astrology-gold font-['Outfit']">
                  {new Date(entry.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="flex items-center gap-1.5 text-orange-400 mb-1 font-bold">
                  <Sun size={14} /> Sunrise / Sunset
                </div>
                <div className="text-gray-300">🌅 {entry.sunrise}</div>
                <div className="text-gray-300">🌇 {entry.sunset}</div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-purple-300 mb-1 font-bold">
                  <Sparkles size={14} /> திதி & நட்சத்திரம்
                </div>
                <div className="text-gray-300"><strong>திதி:</strong> {entry.tithi || '-'}</div>
                <div className="text-gray-300"><strong>நட்சத்திரம்:</strong> {entry.nakshatram || '-'}</div>
                {(entry.yogam || entry.karanam) && (
                  <div className="text-gray-400 text-[11px]">Yog: {entry.yogam || '-'} | Kar: {entry.karanam || '-'}</div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-emerald-400 mb-1 font-bold">
                  <Clock size={14} /> சுப நேரங்கள்
                </div>
                <div className="text-gray-300"><strong>நல்ல நேரம்:</strong> {entry.nallaNeram || '-'}</div>
                <div className="text-gray-300"><strong>கௌரி:</strong> {entry.gowriNallaNeram || '-'}</div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-red-400 mb-1 font-bold">
                  <AlertTriangle size={14} /> தவிர்க்க வேண்டியவை
                </div>
                <div className="text-gray-300"><strong>ராகு:</strong> {entry.rahuKalam || '-'}</div>
                <div className="text-gray-300"><strong>எமகண்டம்:</strong> {entry.yemagandam || '-'}</div>
                <div className="text-gray-300"><strong>குளிகை:</strong> {entry.kuligai || '-'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:border-l border-white/5 md:pl-4 justify-end">
              <button 
                onClick={() => handleOpenEdit(entry)}
                className="p-2 hover:bg-astrology-gold/10 rounded-lg text-gray-400 hover:text-astrology-gold transition-all"
                title="Edit"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => entry.id && handleDelete(entry.id)}
                className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Panchangam
