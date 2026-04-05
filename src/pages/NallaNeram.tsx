import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Clock, Sunrise, Sunset } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'

const NallaNeram = () => {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newEntry, setNewEntry] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    morning: '', 
    evening: '' 
  })

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const response = await fetch('https://vali-backend-ywwv.onrender.com/api/admin/nalla-neram')
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error('Error fetching nalla neram:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('https://vali-backend-ywwv.onrender.com/api/admin/nalla-neram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      })
      if (response.ok) {
        setIsAdding(false)
        setNewEntry({ date: new Date().toISOString().split('T')[0], morning: '', evening: '' })
        fetchEntries()
      }
    } catch (error) {
      console.error('Error adding nalla neram:', error)
    }
  }

  return (
    <div className="font-['Inter']">
      <header className="flex justify-between items-center mb-8 font-['Outfit']">
        <div>
          <h2 className="text-3xl font-bold text-astrology-gold">Nalla Neram</h2>
          <p className="text-gray-400 font-['Inter']">Manage today's auspicious morning and evening timings.</p>
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
          <h3 className="text-xl font-bold text-astrology-gold mb-4 font-['Outfit']">Add Daily Auspicious Time</h3>
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
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-bold">Morning Time</label>
                <input 
                  type="text" 
                  value={newEntry.morning}
                  onChange={(e) => setNewEntry({...newEntry, morning: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-astrology-gold"
                  placeholder="e.g., 09:00 AM - 10:30 AM"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-bold">Evening Time</label>
                <input 
                  type="text" 
                  value={newEntry.evening}
                  onChange={(e) => setNewEntry({...newEntry, evening: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-astrology-gold"
                  placeholder="e.g., 04:30 PM - 06:00 PM"
                  required
                />
              </div>
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

      <div className="bg-astrology-card rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-astrology-gold uppercase text-xs font-bold tracking-widest font-['Outfit']">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Morning (Kaalai)</th>
              <th className="px-6 py-4">Evening (Maalai)</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Loading timings...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No timings found.</td></tr>
            ) : entries.map(entry => (
              <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-bold">{new Date(entry.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-astrology-gold/80">
                    <Sunrise size={16} />
                    {entry.morning}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-orange-400/80">
                    <Sunset size={16} />
                    {entry.evening}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-astrology-gold transition-all">
                      <Edit2 size={16} />
                    </button>
                    <button className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-all">
                      <Trash2 size={16} />
                    </button>
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

export default NallaNeram
