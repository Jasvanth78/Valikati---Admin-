import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Calendar as CalendarIcon, Clock, Tag } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'

const MugurthaNaal = () => {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newEntry, setNewEntry] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    time: '', 
    type: 'Valarpirai', 
    description: '' 
  })

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const response = await fetch('https://vali-backend-ywwv.onrender.com/api/admin/mugurtham')
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
    try {
      const response = await fetch('https://vali-backend-ywwv.onrender.com/api/admin/mugurtham', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      })
      if (response.ok) {
        setIsAdding(false)
        setNewEntry({ date: new Date().toISOString().split('T')[0], time: '', type: 'Valarpirai', description: '' })
        fetchEntries()
      }
    } catch (error) {
      console.error('Error adding mugurtha naal:', error)
    }
  }

  return (
    <div className="font-['Inter']">
      <header className="flex justify-between items-center mb-8 font-['Outfit']">
        <div>
          <h2 className="text-3xl font-bold text-astrology-gold">Mugurtha Naatkkal</h2>
          <p className="text-gray-400 font-['Inter']">Manage auspicious dates and timings for special events.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="btn-gold flex items-center gap-2"
        >
          <Plus size={18} />
          New Entry
        </button>
      </header>

      {isAdding && (
        <div className="mb-8 bg-astrology-card p-6 rounded-xl border border-astrology-gold/30 shadow-2xl">
          <h3 className="text-xl font-bold text-astrology-gold mb-4 font-['Outfit']">Add Auspicious Day</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-bold">Date</label>
                <input 
                  type="date" 
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-astrology-gold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-bold">Time</label>
                <input 
                  type="text" 
                  value={newEntry.time}
                  onChange={(e) => setNewEntry({...newEntry, time: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-astrology-gold"
                  placeholder="e.g., 09:15 AM - 10:45 AM"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-bold">Type</label>
                <select 
                  value={newEntry.type}
                  onChange={(e) => setNewEntry({...newEntry, type: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-astrology-gold"
                >
                  <option value="Valarpirai">Valarpirai</option>
                  <option value="Theipirai">Theipirai</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-bold">Description</label>
              <textarea 
                value={newEntry.description}
                onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-astrology-gold min-h-[80px]"
                placeholder="Details about the auspiciousness (e.g., Suba Mugurtham)..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-6 py-2 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-gold px-8 py-2 rounded-lg font-bold"
              >
                Save Entry
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-500 py-12">Loading auspicious days...</div>
        ) : entries.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12">No auspicious days found.</div>
        ) : entries.map(entry => (
          <div key={entry.id} className="bg-astrology-card p-6 rounded-xl border border-white/5 hover:border-astrology-gold/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-astrology-gold/10 rounded-lg text-astrology-gold group-hover:bg-astrology-gold group-hover:text-black transition-all">
                <CalendarIcon size={24} />
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-astrology-gold transition-all">
                  <Edit2 size={16} />
                </button>
                <button className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] uppercase tracking-tighter font-bold px-2 py-0.5 rounded ${entry.type === 'Valarpirai' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
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
