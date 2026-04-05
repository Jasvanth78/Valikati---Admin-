import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Calendar as CalendarIcon, Clock, Sun, Moon, Wind, Thermometer } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'

const Panchangam = () => {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    sunrise: '06:00 AM',
    sunset: '06:00 PM',
    details: ''
  })

  useEffect(() => {
    fetchPanchangam()
  }, [])

  const fetchPanchangam = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/panchangam`)
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/panchangam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonEncode(newEntry)
      })
      if (response.ok) {
        setIsAdding(false)
        fetchPanchangam()
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          sunrise: '06:00 AM',
          sunset: '06:00 PM',
          details: ''
        })
      }
    } catch (error) {
      console.error('Error adding panchangam:', error)
    }
  }

  // Helper for JSON encoding (React component doesn't have it by default, using global JSON)
  const jsonEncode = (obj: any) => JSON.stringify(obj);

  return (
    <div className="font-['Inter']">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 font-['Outfit']">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-astrology-gold">Panchangam Management</h2>
          <p className="text-gray-400 text-sm md:text-base font-['Inter']">Manage daily sunrise, sunset, and astronomical details.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="btn-gold flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <Plus size={18} />
          New Entry
        </button>
      </header>

      {isAdding && (
        <div className="mb-8 bg-astrology-card p-6 rounded-xl border border-astrology-gold/30 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xl font-bold text-astrology-gold mb-4 font-['Outfit']">Add New Panchangam Entry</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-bold">Date</label>
              <input 
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-bold">Sunrise</label>
              <input 
                type="text"
                placeholder="06:12 AM"
                value={newEntry.sunrise}
                onChange={(e) => setNewEntry({...newEntry, sunrise: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-bold">Sunset</label>
              <input 
                type="text"
                placeholder="06:24 PM"
                value={newEntry.sunset}
                onChange={(e) => setNewEntry({...newEntry, sunset: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                required
              />
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-bold">Astronomical Details</label>
              <textarea 
                placeholder="Tithi, Star, Yoga, Karana details..."
                value={newEntry.details}
                onChange={(e) => setNewEntry({...newEntry, details: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none min-h-[80px]"
                required
              ></textarea>
            </div>
            <div className="md:col-span-2 lg:col-span-4 flex gap-3 justify-end mt-2">
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-6 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-sm font-bold"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-gold px-8 py-2 rounded-lg text-sm font-bold"
              >
                Save Entry
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
                <div className="text-lg font-bold text-astrology-gold font-['Outfit']">{new Date(entry.date).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Sun className="text-orange-400" size={20} />
                <div>
                  <div className="text-xs text-gray-500">Sunrise</div>
                  <div className="font-medium">{entry.sunrise}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Moon className="text-blue-400" size={20} />
                <div>
                  <div className="text-xs text-gray-500">Sunset</div>
                  <div className="font-medium">{entry.sunset}</div>
                </div>
              </div>
              <div className="col-span-full lg:col-span-1">
                <div className="text-xs text-gray-500 mb-1">Details</div>
                <div className="text-sm text-gray-300 italic">"{entry.details}"</div>
              </div>
            </div>

            <div className="flex items-center gap-3 md:border-l border-white/5 md:pl-6 justify-end">
              <button className="p-2 hover:bg-astrology-gold/10 rounded-lg text-gray-400 hover:text-astrology-gold transition-all">
                <Edit2 size={18} />
              </button>
              <button className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-all">
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
