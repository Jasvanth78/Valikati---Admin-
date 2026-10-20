import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit } from 'lucide-react'
import { fetchApi } from '../utils/api'

export default function GovtHolidays() {
  const [holidays, setHolidays] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ date: '', month: '', nameTa: '', nameEn: '', color: '#E8F5E9' })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetchHolidays()
  }, [])

  const fetchHolidays = async () => {
    try {
      const data = await fetchApi('/api/govt-holidays')
      if (!Array.isArray(data)) throw new Error('Invalid backend response')
      setHolidays(data)
      setLoading(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed. Please retry.')
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId 
        ? `/api/govt-holidays/${editingId}`
        : '/api/govt-holidays'
      const method = editingId ? 'PUT' : 'POST'

      await fetchApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      setMessage('Holiday saved and published.')
      {
        setFormData({ date: '', month: '', nameTa: '', nameEn: '', color: '#E8F5E9' })
        setEditingId(null)
        fetchHolidays()
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed. Please retry.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      await fetchApi(`/api/govt-holidays/${id}`, { method: 'DELETE' })
      fetchHolidays()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed. Please retry.')
    }
  }

  const editHoliday = (h: any) => {
    setEditingId(h.id)
    setFormData({ date: h.date, month: h.month, nameTa: h.nameTa, nameEn: h.nameEn, color: h.color })
  }

  return (
    <div className="space-y-6">
      {message && <p role="status" className="text-astrology-gold">{message}</p>}
      <h2 className="text-2xl font-bold bg-gold-gradient bg-clip-text text-transparent">Government Holidays</h2>
      
      <div className="bg-astrology-card p-6 rounded-xl border border-astrology-gold/20">
        <h3 className="text-xl font-bold mb-4">{editingId ? 'Edit Holiday' : 'Add New Holiday'}</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required placeholder="Date (e.g. 02)" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-black/50 border border-astrology-gold/20 rounded p-2 text-white" />
          <input required placeholder="Month (e.g. OCT)" value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} className="bg-black/50 border border-astrology-gold/20 rounded p-2 text-white" />
          <input required placeholder="Name (Tamil)" value={formData.nameTa} onChange={e => setFormData({...formData, nameTa: e.target.value})} className="bg-black/50 border border-astrology-gold/20 rounded p-2 text-white" />
          <input placeholder="Name (English ? automatic when blank)" value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})} className="bg-black/50 border border-astrology-gold/20 rounded p-2 text-white" />
          <div className="flex items-center gap-4 bg-black/50 border border-astrology-gold/20 rounded p-2">
            <span className="text-gray-400 text-sm">Background Color:</span>
            <input required type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-10 h-10 cursor-pointer" />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="bg-gold-gradient text-astrology-dark font-bold px-6 py-2 rounded">
              {editingId ? 'Update' : 'Add'} Holiday
            </button>
            {editingId && (
              <button type="button" onClick={() => {setEditingId(null); setFormData({ date: '', month: '', nameTa: '', nameEn: '', color: '#E8F5E9' })}} className="ml-4 text-gray-400 hover:text-white">Cancel</button>
            )}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <p>Loading...</p> : holidays.map((h: any) => (
          <div key={h.id} className="bg-astrology-card p-4 rounded-xl border border-astrology-gold/20 flex items-center justify-between">
            <div className="flex gap-4 items-center">
              <div style={{backgroundColor: h.color}} className="p-3 rounded-lg text-black text-center min-w-[60px]">
                <div className="text-xs font-bold">{h.month}</div>
                <div className="text-lg font-black">{h.date}</div>
              </div>
              <div>
                <p className="font-bold">{h.nameTa}</p>
                <p className="text-sm text-gray-400">{h.nameEn}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => editHoliday(h)} className="text-blue-400 hover:text-blue-300"><Edit size={18}/></button>
              <button onClick={() => handleDelete(h.id)} className="text-red-400 hover:text-red-300"><Trash2 size={18}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
