import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Calendar as CalendarIcon, Clock, X, Search, Sparkles, Heart, Home, Navigation, Star } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'

const CATEGORIES = [
  { key: 'marriage', label: 'Marriage (திருமணம்)', icon: Heart, badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  { key: 'house_opening', label: 'House Warming (கிரஹபிரவேசம் / வீடு)', icon: Home, badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { key: 'travel', label: 'Travel / Vehicle (பயணம் / வாகன பூஜை)', icon: Navigation, badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { key: 'general', label: 'General Suba Mugurtham (பொது முகூர்த்தம்)', icon: Star, badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
]

const MugurthaNaal = () => {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')

  const [newEntry, setNewEntry] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    time: '', 
    type: 'Valarpirai', 
    category: 'marriage',
    description: '' 
  })

  const [editEntry, setEditEntry] = useState({ 
    id: '',
    date: '', 
    time: '', 
    type: 'Valarpirai', 
    category: 'marriage',
    description: '' 
  })

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/mugurtham`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error('Error fetching mugurtha naal:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEntry.time.trim()) {
      alert('Please enter time')
      return
    }

    // Format description with category tag if needed
    const categoryObj = CATEGORIES.find(c => c.key === newEntry.category)
    const formattedDesc = newEntry.description.trim() ? 
      `[${categoryObj?.label || newEntry.category}] ${newEntry.description.trim()}` : 
      (categoryObj?.label || 'Suba Mugurtham')

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/mugurtham`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        },
        body: JSON.stringify({
          date: newEntry.date,
          time: newEntry.time,
          type: newEntry.type,
          description: formattedDesc,
        })
      })
      if (response.ok) {
        setIsAdding(false)
        setNewEntry({ date: new Date().toISOString().split('T')[0], time: '', type: 'Valarpirai', category: 'marriage', description: '' })
        fetchEntries()
      } else {
        alert('Failed to add Mugurtham entry')
      }
    } catch (error) {
      console.error('Error adding mugurtha naal:', error)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editEntry.time.trim()) return

    const categoryObj = CATEGORIES.find(c => c.key === editEntry.category)
    const cleanDesc = editEntry.description.replace(/^\[.*?\]\s*/, '')
    const formattedDesc = cleanDesc ? 
      `[${categoryObj?.label || editEntry.category}] ${cleanDesc}` : 
      (categoryObj?.label || 'Suba Mugurtham')

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/mugurtham/${editEntry.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        },
        body: JSON.stringify({
          date: editEntry.date,
          time: editEntry.time,
          type: editEntry.type,
          description: formattedDesc,
        })
      })
      if (response.ok) {
        setEditingId(null)
        fetchEntries()
      } else {
        alert('Failed to update Mugurtham entry')
      }
    } catch (error) {
      console.error('Error updating entry:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Mugurtham entry?')) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/mugurtham/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
      if (response.ok) {
        fetchEntries()
      } else {
        alert('Failed to delete entry')
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
    }
  }

  const startEdit = (entry: any) => {
    setEditingId(entry.id)
    let detectedCategory = 'general'
    const desc = entry.description || ''
    if (desc.toLowerCase().includes('marriage') || desc.includes('திருமணம்')) detectedCategory = 'marriage'
    else if (desc.toLowerCase().includes('house') || desc.includes('கிரஹ') || desc.includes('வீடு')) detectedCategory = 'house_opening'
    else if (desc.toLowerCase().includes('travel') || desc.includes('பயணம்') || desc.includes('வாகன')) detectedCategory = 'travel'

    setEditEntry({
      id: entry.id,
      date: new Date(entry.date).toISOString().split('T')[0],
      time: entry.time || '',
      type: entry.type || 'Valarpirai',
      category: detectedCategory,
      description: desc.replace(/^\[.*?\]\s*/, '')
    })
  }

  const filteredEntries = entries
    .filter(e => selectedTypeFilter === 'all' || e.type === selectedTypeFilter)
    .filter(e => {
      if (selectedCategoryFilter === 'all') return true;
      const d = (e.description || '').toLowerCase();
      if (selectedCategoryFilter === 'marriage') return d.includes('marriage') || d.includes('திருமணம்');
      if (selectedCategoryFilter === 'house_opening') return d.includes('house') || d.includes('கிரஹ') || d.includes('வீடு');
      if (selectedCategoryFilter === 'travel') return d.includes('travel') || d.includes('பயணம்') || d.includes('வாகன');
      return true;
    })
    .filter(e => 
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.time && e.time.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.type && e.type.toLowerCase().includes(searchQuery.toLowerCase()))
    )

  return (
    <div className="font-['Inter']">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 font-['Outfit']">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-astrology-gold flex items-center gap-2">
            <Sparkles className="text-astrology-gold" size={28} />
            Mugurtha Naatkkal Management
          </h2>
          <p className="text-gray-400 text-sm md:text-base font-['Inter']">Manage auspicious dates for Marriage, House Warming, Travel, and Special Events.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-astrology-gold text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-astrology-gold/20 hover:opacity-90 transition-opacity"
        >
          <Plus size={18} />
          Add Mugurtham Day
        </button>
      </header>

      {/* Add Form */}
      {isAdding && (
        <div className="mb-8 bg-astrology-card p-6 rounded-xl border border-astrology-gold/30 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-astrology-gold font-['Outfit']">Add Auspicious Day</h3>
            <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Category (முகூர்த்த வகை)</label>
                <select 
                  value={newEntry.category}
                  onChange={(e) => setNewEntry({...newEntry, category: e.target.value})}
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-astrology-gold"
                >
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Date</label>
                <input 
                  type="date" 
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-astrology-gold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Time</label>
                <input 
                  type="text" 
                  value={newEntry.time}
                  onChange={(e) => setNewEntry({...newEntry, time: e.target.value})}
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-astrology-gold"
                  placeholder="e.g., 09:15 AM - 10:45 AM"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Moon Phase (பிறை)</label>
                <select 
                  value={newEntry.type}
                  onChange={(e) => setNewEntry({...newEntry, type: e.target.value})}
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-astrology-gold"
                >
                  <option value="Valarpirai">Valarpirai (வளர்பிறை)</option>
                  <option value="Theipirai">Theipirai (தேய்பிறை)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Additional Notes / Details</label>
              <textarea 
                value={newEntry.description}
                onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                className="w-full bg-black/50 border border-white/15 rounded-lg p-3 text-white outline-none focus:border-astrology-gold min-h-[70px]"
                placeholder="Star details or extra notes (e.g., மகம் நட்சத்திரம்)..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-5 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="bg-astrology-gold text-black px-6 py-2.5 rounded-lg font-bold hover:opacity-90"
              >
                Save Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form Modal */}
      {editingId && (
        <div className="mb-8 bg-astrology-card p-6 rounded-xl border border-blue-500/40 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-blue-400 font-['Outfit']">Edit Mugurtham Entry</h3>
            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Category</label>
                <select 
                  value={editEntry.category}
                  onChange={(e) => setEditEntry({...editEntry, category: e.target.value})}
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-blue-400"
                >
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Date</label>
                <input 
                  type="date" 
                  value={editEntry.date}
                  onChange={(e) => setEditEntry({...editEntry, date: e.target.value})}
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-blue-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Time</label>
                <input 
                  type="text" 
                  value={editEntry.time}
                  onChange={(e) => setEditEntry({...editEntry, time: e.target.value})}
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-blue-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Type</label>
                <select 
                  value={editEntry.type}
                  onChange={(e) => setEditEntry({...editEntry, type: e.target.value})}
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-blue-400"
                >
                  <option value="Valarpirai">Valarpirai (வளர்பிறை)</option>
                  <option value="Theipirai">Theipirai (தேய்பிறை)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Additional Notes / Details</label>
              <textarea 
                value={editEntry.description}
                onChange={(e) => setEditEntry({...editEntry, description: e.target.value})}
                className="w-full bg-black/50 border border-white/15 rounded-lg p-3 text-white outline-none focus:border-blue-400 min-h-[70px]"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button 
                type="button" 
                onClick={() => setEditingId(null)}
                className="px-5 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-600"
              >
                Update Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${selectedCategoryFilter === 'all' ? 'bg-astrology-gold text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            All Categories
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setSelectedCategoryFilter(c.key)}
              className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${selectedCategoryFilter === c.key ? 'bg-astrology-gold text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              {c.label.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search mugurtham dates..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-astrology-gold w-full md:w-60"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-500 py-12">Loading auspicious days...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12">No auspicious days found.</div>
        ) : filteredEntries.map(entry => (
          <div key={entry.id} className="bg-astrology-card p-6 rounded-xl border border-white/5 hover:border-astrology-gold/30 transition-all group shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-astrology-gold/10 rounded-lg text-astrology-gold group-hover:bg-astrology-gold group-hover:text-black transition-all">
                <CalendarIcon size={24} />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => startEdit(entry)}
                  className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-astrology-gold transition-all"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(entry.id)}
                  className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] uppercase tracking-tighter font-bold px-2 py-0.5 rounded ${entry.type === 'Valarpirai' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                {entry.type}
              </span>
              <span className="text-astrology-gold/80 text-sm font-bold tracking-widest uppercase">
                {new Date(entry.date).toLocaleDateString()}
              </span>
            </div>
            <h4 className="text-xl font-bold mb-2 text-white group-hover:text-astrology-gold transition-all font-['Outfit'] flex items-center gap-2">
              <Clock size={18} className="text-astrology-gold" />
              {entry.time}
            </h4>
            <p className="text-gray-400 text-sm italic border-t border-white/5 pt-3 mt-3">
              {entry.description || "Suba Mugurtham"}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MugurthaNaal
