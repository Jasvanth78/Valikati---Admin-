import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Calendar as CalendarIcon, Image as ImageIcon } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'
import { ImageUploader } from '../components/ImageUploader'

interface FestivalForm {
  id?: string
  name: string
  date: string
  description: string
  imageUrl: string
}

const emptyFest: FestivalForm = { 
  name: '', 
  date: new Date().toISOString().split('T')[0], 
  description: '',
  imageUrl: '' 
}

const Festivals = () => {
  const [festivals, setFestivals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [festForm, setFestForm] = useState<FestivalForm>(emptyFest)

  useEffect(() => {
    fetchFestivals()
  }, [])

  const fetchFestivals = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/festivals`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const isEdit = !!editingId
    const url = isEdit 
      ? `${API_BASE_URL}/api/admin/festivals/${editingId}`
      : `${API_BASE_URL}/api/admin/festivals`
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        },
        body: JSON.stringify(festForm)
      })
      if (response.ok) {
        setIsAdding(false)
        setEditingId(null)
        setFestForm(emptyFest)
        fetchFestivals()
      }
    } catch (error) {
      console.error('Error saving festival:', error)
    }
  }

  const handleEdit = (fest: any) => {
    const formattedDate = fest.date ? new Date(fest.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    setFestForm({
      id: fest.id,
      name: fest.name || '',
      date: formattedDate,
      description: fest.description || '',
      imageUrl: fest.imageUrl || ''
    })
    setEditingId(fest.id)
    setIsAdding(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/festivals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
      if (response.ok) {
        fetchFestivals()
      }
    } catch (error) {
      console.error('Error deleting festival:', error)
    }
  }

  return (
    <div className="font-['Inter']">
      <header className="flex justify-between items-center mb-8 font-['Outfit']">
        <div>
          <h2 className="text-3xl font-bold text-astrology-gold">Festival Management</h2>
          <p className="text-gray-400 font-['Inter']">Add and manage upcoming festivals with custom images and details.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null)
            setFestForm(emptyFest)
            setIsAdding(true)
          }}
          className="btn-gold flex items-center gap-2"
        >
          <Plus size={18} />
          New Festival
        </button>
      </header>

      {isAdding && (
        <div className="mb-8 bg-astrology-card p-6 rounded-xl border border-astrology-gold/30 shadow-2xl">
          <h3 className="text-xl font-bold text-astrology-gold mb-4 font-['Outfit']">
            {editingId ? 'Edit Festival' : 'Add New Festival'}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-bold">Festival Name</label>
                <input 
                  type="text" 
                  value={festForm.name}
                  onChange={(e) => setFestForm({...festForm, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-astrology-gold"
                  placeholder="e.g., Deepavali, Pongal, Aadi Perukku"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-bold">Date</label>
                <input 
                  type="date" 
                  value={festForm.date}
                  onChange={(e) => setFestForm({...festForm, date: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-astrology-gold"
                  required
                />
              </div>
            </div>

            <div>
              <ImageUploader 
                label="Festival Image"
                value={festForm.imageUrl}
                onChange={(url) => setFestForm({...festForm, imageUrl: url})}
                folder="festivals"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-bold">Description</label>
              <textarea 
                value={festForm.description}
                onChange={(e) => setFestForm({...festForm, description: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-astrology-gold min-h-[80px]"
                placeholder="Brief details about the festival..."
                required
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button 
                type="button" 
                onClick={() => {
                  setIsAdding(false)
                  setEditingId(null)
                  setFestForm(emptyFest)
                }}
                className="px-6 py-2 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-gold px-8 py-2 rounded-lg font-bold"
              >
                {editingId ? 'Update Festival' : 'Save Festival'}
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
          <div key={fest.id} className="bg-astrology-card p-6 rounded-xl border border-white/5 hover:border-astrology-gold/30 transition-all group flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                {fest.imageUrl ? (
                  <img 
                    src={fest.imageUrl} 
                    alt={fest.name}
                    className="w-14 h-14 object-cover rounded-xl border border-astrology-gold/40 shadow-md"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                ) : (
                  <div className="p-3 bg-astrology-gold/10 rounded-lg text-astrology-gold group-hover:bg-astrology-gold group-hover:text-black transition-all">
                    <CalendarIcon size={24} />
                  </div>
                )}
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(fest)}
                    className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-astrology-gold transition-all"
                    title="Edit Festival"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(fest.id, fest.name)}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h4 className="text-xl font-bold mb-1 text-white group-hover:text-astrology-gold transition-all font-['Outfit']">{fest.name}</h4>
              <div className="text-astrology-gold/80 text-xs mb-3 font-bold tracking-widest uppercase">
                {new Date(fest.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' })}
              </div>
              <p className="text-gray-400 text-sm line-clamp-3 italic">"{fest.description}"</p>
            </div>
            {fest.imageUrl && (
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-gray-500">
                <ImageIcon size={12} className="text-astrology-gold/60" />
                <span className="truncate">{fest.imageUrl}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Festivals
