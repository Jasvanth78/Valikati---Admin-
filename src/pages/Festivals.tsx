import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Calendar as CalendarIcon, Info } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'

const Festivals = () => {
  const [festivals, setFestivals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newFest, setNewFest] = useState({ 
    name: '', 
    date: new Date().toISOString().split('T')[0], 
    description: '' 
  })

  useEffect(() => {
    fetchFestivals()
  }, [])

  const fetchFestivals = async () => {
    try {
      const response = await fetch('https://vali-backend-ywwv.onrender.com/api/admin/festivals')
      if (response.ok) {
        const data = await response.json()
        setFestivals(data)
      }
    } catch (error) {
      console.error('Error fetching festivals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('https://vali-backend-ywwv.onrender.com/api/admin/festivals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFest)
      })
      if (response.ok) {
        setIsAdding(false)
        setNewFest({ name: '', date: new Date().toISOString().split('T')[0], description: '' })
        fetchFestivals()
      }
    } catch (error) {
      console.error('Error adding festival:', error)
    }
  }

  return (
    <div className="font-['Inter']">
      <header className="flex justify-between items-center mb-8 font-['Outfit']">
        <div>
          <h2 className="text-3xl font-bold text-astrology-gold">Festival Management</h2>
          <p className="text-gray-400 font-['Inter']">Add and manage upcoming festivals and special events.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="btn-gold flex items-center gap-2"
        >
          <Plus size={18} />
          New Festival
        </button>
      </header>

      {isAdding && (
        <div className="mb-8 bg-astrology-card p-6 rounded-xl border border-astrology-gold/30 shadow-2xl">
          <h3 className="text-xl font-bold text-astrology-gold mb-4 font-['Outfit']">Add New Festival</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-bold">Festival Name</label>
                <input 
                  type="text" 
                  value={newFest.name}
                  onChange={(e) => setNewFest({...newFest, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-astrology-gold"
                  placeholder="e.g., Deepavali, Pongal"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-bold">Date</label>
                <input 
                  type="date" 
                  value={newFest.date}
                  onChange={(e) => setNewFest({...newFest, date: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-astrology-gold"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-bold">Description</label>
              <textarea 
                value={newFest.description}
                onChange={(e) => setNewFest({...newFest, description: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-astrology-gold min-h-[80px]"
                placeholder="Brief details about the festival..."
                required
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
                Save Festival
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-500 py-12">Loading festivals...</div>
        ) : festivals.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12">No festivals found.</div>
        ) : festivals.map(fest => (
          <div key={fest.id} className="bg-astrology-card p-6 rounded-xl border border-white/5 hover:border-astrology-gold/30 transition-all group">
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
            <h4 className="text-xl font-bold mb-1 text-white group-hover:text-astrology-gold transition-all font-['Outfit']">{fest.name}</h4>
            <div className="text-astrology-gold/80 text-sm mb-4 font-bold tracking-widest uppercase">{new Date(fest.date).toLocaleDateString()}</div>
            <p className="text-gray-400 text-sm line-clamp-3 italic">"{fest.description}"</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Festivals
