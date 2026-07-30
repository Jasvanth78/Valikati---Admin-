import React, { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Trash2, Search, Filter, Upload, FileText, Check, X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'

const RASIS = [
  'Mesham', 'Rishabam', 'Midhunam', 'Kadagam', 
  'Simmam', 'Kanni', 'Thulaam', 'Viruchigam', 
  'Dhanusu', 'Magaram', 'Kumbam', 'Meenam'
]

const RasiPalan = () => {
  const [activeTab, setActiveTab] = useState('daily')
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [showAspects, setShowAspects] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRasiFilter, setSelectedRasiFilter] = useState('all')

  const [newPred, setNewPred] = useState({ 
    rasi: 'Mesham', 
    type: 'daily', 
    content: '', 
    work: '',
    money: '',
    health: '',
    love: '',
    date: new Date().toISOString().split('T')[0] 
  })

  const [editPred, setEditPred] = useState({ 
    id: '',
    rasi: 'Mesham', 
    type: 'daily', 
    content: '', 
    work: '',
    money: '',
    health: '',
    love: '',
    date: '' 
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchPredictions()
  }, [])

  const fetchPredictions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/rasi-palan`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
      if (response.ok) {
        const data = await response.json()
        setPredictions(data)
      }
    } catch (error) {
      console.error('Error fetching predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPred.content.trim()) {
      alert('Please enter general prediction content')
      return
    }

    let payloadContent = newPred.content.trim()
    if (newPred.work.trim() || newPred.money.trim() || newPred.health.trim() || newPred.love.trim()) {
      payloadContent = JSON.stringify({
        general: newPred.content.trim(),
        work: newPred.work.trim(),
        money: newPred.money.trim(),
        health: newPred.health.trim(),
        love: newPred.love.trim(),
      })
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/rasi-palan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        },
        body: JSON.stringify({
          rasi: newPred.rasi,
          type: newPred.type,
          content: payloadContent,
          date: newPred.date,
        })
      })
      if (response.ok) {
        setIsAdding(false)
        setShowAspects(false)
        setNewPred({ 
          rasi: 'Mesham', 
          type: activeTab, 
          content: '', 
          work: '', 
          money: '', 
          health: '', 
          love: '', 
          date: new Date().toISOString().split('T')[0] 
        })
        fetchPredictions()
      } else {
        alert('Failed to add prediction')
      }
    } catch (error) {
      console.error('Error adding prediction:', error)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editPred.content.trim()) return

    let payloadContent = editPred.content.trim()
    if (editPred.work.trim() || editPred.money.trim() || editPred.health.trim() || editPred.love.trim()) {
      payloadContent = JSON.stringify({
        general: editPred.content.trim(),
        work: editPred.work.trim(),
        money: editPred.money.trim(),
        health: editPred.health.trim(),
        love: editPred.love.trim(),
      })
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/rasi-palan/${editPred.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        },
        body: JSON.stringify({
          rasi: editPred.rasi,
          type: editPred.type,
          content: payloadContent,
          date: editPred.date,
        })
      })
      if (response.ok) {
        setEditingId(null)
        fetchPredictions()
      } else {
        alert('Failed to update prediction')
      }
    } catch (error) {
      console.error('Error updating prediction:', error)
    }
  }

  const handleDelete = async (id: string, rasi: string) => {
    if (!window.confirm(`Are you sure you want to delete prediction for ${rasi}?`)) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/rasi-palan/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
      if (response.ok) {
        fetchPredictions()
      } else {
        alert('Failed to delete prediction')
      }
    } catch (error) {
      console.error('Error deleting prediction:', error)
    }
  }

  const startEdit = (pred: any) => {
    setEditingId(pred.id)
    let parsed: any = {}
    try {
      if (pred.content && pred.content.trim().startsWith('{')) {
        parsed = JSON.parse(pred.content)
      }
    } catch (e) {}

    setEditPred({
      id: pred.id,
      rasi: pred.rasi,
      type: pred.type,
      content: parsed.general || parsed.content || pred.content,
      work: parsed.work || '',
      money: parsed.money || '',
      health: parsed.health || '',
      love: parsed.love || '',
      date: new Date(pred.date).toISOString().split('T')[0]
    })
  }

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n')
      
      const data = lines.slice(1).filter(line => line.trim() !== '').map(line => {
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const cleanedValues = values.map(v => v.replace(/^"|"$/g, ''))
        
        return {
          rasi: cleanedValues[0] || 'Mesham',
          type: cleanedValues[1] || 'daily',
          content: cleanedValues[2] || '',
          date: cleanedValues[3] || new Date().toISOString().split('T')[0]
        }
      })

      if (data.length === 0) return

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/rasi-palan/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
          },
          body: JSON.stringify({ data })
        })
        if (response.ok) {
          alert(`Successfully uploaded ${data.length} records`)
          fetchPredictions()
        } else {
          const err = await response.json()
          alert(`Upload failed: ${err.error || 'Unknown error'}`)
        }
      } catch (error) {
        console.error('Error uploading CSV:', error)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Filtered Predictions
  const filteredPredictions = predictions
    .filter(p => p.type === activeTab)
    .filter(p => selectedRasiFilter === 'all' || p.rasi === selectedRasiFilter)
    .filter(p => 
      p.rasi.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.content.toLowerCase().includes(searchQuery.toLowerCase())
    )

  return (
    <div className="font-['Inter']">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-astrology-gold font-['Outfit'] flex items-center gap-2">
            <Sparkles className="text-astrology-gold" size={28} />
            Rasi Palan Management
          </h2>
          <p className="text-gray-400 text-sm md:text-base">Publish and manage daily, weekly, monthly, and yearly horoscope predictions.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleCsvUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white/10 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-white/10 hover:bg-white/20 transition-colors"
          >
            <Upload size={18} />
            Bulk CSV Upload
          </button>
          <button 
            onClick={() => {
              setIsAdding(true);
              setNewPred(prev => ({ ...prev, type: activeTab }));
            }}
            className="bg-astrology-gold text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-astrology-gold/20 hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            Add Prediction
          </button>
        </div>
      </header>

      {/* Add New Form */}
      {isAdding && (
        <div className="mb-8 bg-astrology-card p-6 rounded-xl border border-astrology-gold/30 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-astrology-gold font-['Outfit']">Add New Rasi Palan</h3>
            <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Rasi (Zodiac Sign)</label>
                <select 
                  value={newPred.rasi} 
                  onChange={e => setNewPred({...newPred, rasi: e.target.value})}
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-astrology-gold"
                >
                  {RASIS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Period Type</label>
                <select 
                  value={newPred.type} 
                  onChange={e => setNewPred({...newPred, type: e.target.value})}
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-astrology-gold capitalize"
                >
                  {['daily', 'weekly', 'monthly', 'yearly'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date</label>
                <input 
                  type="date" 
                  value={newPred.date} 
                  onChange={e => setNewPred({...newPred, date: e.target.value})}
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-astrology-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">General Prediction (பொது பலன்)</label>
              <textarea 
                placeholder="இன்றைய நாள் உங்களுக்கு சிறப்பான பலன்களை தரும்..."
                className="w-full bg-black/50 border border-white/15 rounded-lg p-3 h-24 text-white outline-none focus:border-astrology-gold"
                value={newPred.content}
                onChange={e => setNewPred({...newPred, content: e.target.value})}
              />
            </div>

            {/* Optional Specific Aspect Cards Toggle */}
            <div className="border-t border-white/10 pt-3">
              <button 
                type="button" 
                onClick={() => setShowAspects(!showAspects)}
                className="text-xs text-astrology-gold font-bold flex items-center gap-1 hover:underline"
              >
                {showAspects ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showAspects ? 'Hide Specific Aspects (Work, Money, Health, Love)' : '+ Add Specific Aspects (Work, Money, Health, Love)'}
              </button>

              {showAspects && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 bg-black/30 p-4 rounded-xl border border-white/5">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Work / Career (தொழில் / பணி)</label>
                    <textarea 
                      placeholder="தொழிலில் நல்ல முன்னேற்றம் உண்டாகும்..."
                      className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 h-20 text-xs text-white outline-none focus:border-astrology-gold"
                      value={newPred.work}
                      onChange={e => setNewPred({...newPred, work: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Money / Finance (தன நிலை / பணம்)</label>
                    <textarea 
                      placeholder="நிதி நிலைமை திருப்திகரமாக இருக்கும்..."
                      className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 h-20 text-xs text-white outline-none focus:border-astrology-gold"
                      value={newPred.money}
                      onChange={e => setNewPred({...newPred, money: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Health (ஆரோக்கியம்)</label>
                    <textarea 
                      placeholder="உடல் ஆரோக்கியம் மேம்படும்..."
                      className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 h-20 text-xs text-white outline-none focus:border-astrology-gold"
                      value={newPred.health}
                      onChange={e => setNewPred({...newPred, health: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Love / Relationship (அன்பு / குடும்பம்)</label>
                    <textarea 
                      placeholder="குடும்பத்தில் மகிழ்ச்சி நிலவும்..."
                      className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 h-20 text-xs text-white outline-none focus:border-astrology-gold"
                      value={newPred.love}
                      onChange={e => setNewPred({...newPred, love: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="bg-astrology-gold text-black px-6 py-2.5 rounded-lg font-bold hover:opacity-90">Save Prediction</button>
              <button type="button" onClick={() => setIsAdding(false)} className="bg-white/10 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-white/20">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form Modal */}
      {editingId && (
        <div className="mb-8 bg-astrology-card p-6 rounded-xl border border-blue-500/40 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-blue-400 font-['Outfit']">Edit Prediction</h3>
            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Rasi</label>
                <select 
                  value={editPred.rasi} 
                  onChange={e => setEditPred({...editPred, rasi: e.target.value})}
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-blue-400"
                >
                  {RASIS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Period Type</label>
                <select 
                  value={editPred.type} 
                  onChange={e => setEditPred({...editPred, type: e.target.value})}
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-blue-400 capitalize"
                >
                  {['daily', 'weekly', 'monthly', 'yearly'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date</label>
                <input 
                  type="date" 
                  value={editPred.date} 
                  onChange={e => setEditPred({...editPred, date: e.target.value})}
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">General Prediction</label>
              <textarea 
                className="w-full bg-black/50 border border-white/15 rounded-lg p-3 h-24 text-white outline-none focus:border-blue-400"
                value={editPred.content}
                onChange={e => setEditPred({...editPred, content: e.target.value})}
              />
            </div>

            {/* Specific Aspect Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Work / Career (தொழில்)</label>
                <textarea 
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 h-20 text-xs text-white outline-none focus:border-blue-400"
                  value={editPred.work}
                  onChange={e => setEditPred({...editPred, work: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Money / Finance (பணம்)</label>
                <textarea 
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 h-20 text-xs text-white outline-none focus:border-blue-400"
                  value={editPred.money}
                  onChange={e => setEditPred({...editPred, money: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Health (ஆரோக்கியம்)</label>
                <textarea 
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 h-20 text-xs text-white outline-none focus:border-blue-400"
                  value={editPred.health}
                  onChange={e => setEditPred({...editPred, health: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Love / Relationship (அன்பு)</label>
                <textarea 
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-2.5 h-20 text-xs text-white outline-none focus:border-blue-400"
                  value={editPred.love}
                  onChange={e => setEditPred({...editPred, love: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-600">Update Prediction</button>
              <button type="button" onClick={() => setEditingId(null)} className="bg-white/10 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-white/20">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
        <div className="flex gap-4">
          {['daily', 'weekly', 'monthly', 'yearly'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-3 capitalize font-semibold transition-all ${activeTab === tab ? 'text-astrology-gold border-b-2 border-astrology-gold font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Rasi Filter Dropdown */}
          <select 
            value={selectedRasiFilter}
            onChange={e => setSelectedRasiFilter(e.target.value)}
            className="bg-black/40 border border-white/10 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-astrology-gold"
          >
            <option value="all">All Rasis</option>
            {RASIS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search predictions..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-astrology-gold w-48 md:w-60"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-astrology-card rounded-xl border border-astrology-gold/10 overflow-x-auto shadow-2xl">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-black/30 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Rasi</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Content Preview</th>
              <th className="px-6 py-4">Aspects</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading predictions...</td></tr>
            ) : filteredPredictions.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No {activeTab} predictions found</td></tr>
            ) : filteredPredictions.map(pred => {
              let parsed: any = {}
              try {
                if (pred.content && pred.content.trim().startsWith('{')) {
                  parsed = JSON.parse(pred.content)
                }
              } catch (e) {}

              const mainText = parsed.general || parsed.content || pred.content
              const hasAspects = parsed.work || parsed.money || parsed.health || parsed.love

              return (
                <tr key={pred.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-bold text-astrology-gold">{pred.rasi}</td>
                  <td className="px-6 py-4 text-gray-300 text-sm">{new Date(pred.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-gray-400 text-xs max-w-xs truncate">{mainText}</td>
                  <td className="px-6 py-4 text-xs">
                    {hasAspects ? (
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                        Work / Money / Health / Love
                      </span>
                    ) : (
                      <span className="text-gray-500 italic">General Only</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                      Published
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3 text-gray-400">
                      <button 
                        onClick={() => startEdit(pred)}
                        className="hover:text-astrology-gold transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(pred.id, pred.rasi)}
                        className="hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RasiPalan
