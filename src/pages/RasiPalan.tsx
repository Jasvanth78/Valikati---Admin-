import React, { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Trash2, Search, Filter, Upload, FileText } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'

const RasiPalan = () => {
  const [activeTab, setActiveTab] = useState('daily')
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newPred, setNewPred] = useState({ rasi: 'Mesham', type: 'daily', content: '', date: new Date().toISOString().split('T')[0] })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchPredictions()
  }, [])

  const fetchPredictions = async () => {
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
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/rasi-palan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        },
        body: JSON.stringify(newPred)
      })
      if (response.ok) {
        setIsAdding(false)
        setNewPred({ rasi: 'Mesham', type: 'daily', content: '', date: new Date().toISOString().split('T')[0] })
        fetchPredictions()
      }
    } catch (error) {
      console.error('Error adding prediction:', error)
    }
  }

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n')
      const headers = lines[0].split(',') // rasi,type,content,date
      
      const data = lines.slice(1).filter(line => line.trim() !== '').map(line => {
        // Simple comma split but handle quotes if possible
        // For robustness, users should avoid commas in content or use a library
        // Here's a very basic regex to handle quotes
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const cleanedValues = values.map(v => v.replace(/^"|"$/g, ''))
        
        return {
          rasi: cleanedValues[0],
          type: cleanedValues[1],
          content: cleanedValues[2],
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
    // reset input
    e.target.value = ''
  }

  return (
    <div className="font-['Inter']">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-astrology-gold font-['Outfit']">Rasi Palan Management</h2>
          <p className="text-gray-400 text-sm md:text-base">Manage daily, weekly, monthly and yearly predictions.</p>
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
            className="bg-white/10 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-white/10 hover:bg-white/20"
          >
            <Upload size={18} />
            Bulk Upload (CSV)
          </button>
          <button 
            onClick={() => {
              setIsAdding(true);
              setNewPred(prev => ({ ...prev, type: activeTab }));
            }}
            className="bg-astrology-gold text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-astrology-gold/20"
          >
            <Plus size={18} />
            Add New Prediction
          </button>
        </div>
      </header>

      {isAdding && (
        <div className="mb-8 bg-astrology-card p-6 rounded-xl border border-astrology-gold/20">
          <h3 className="text-xl font-bold mb-4 text-astrology-gold">Add New Prediction</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select 
              value={newPred.rasi} 
              onChange={e => setNewPred({...newPred, rasi: e.target.value})}
              className="bg-black/40 border border-white/10 rounded-lg p-2 outline-none focus:border-astrology-gold"
            >
              {[
                'Mesham', 'Rishabam', 'Midhunam', 'Kadagam', 
                'Simmam', 'Kanni', 'Thulaam', 'Viruchigam', 
                'Dhanusu', 'Magaram', 'Kumbam', 'Meenam'
              ].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select 
              value={newPred.type} 
              onChange={e => setNewPred({...newPred, type: e.target.value})}
              className="bg-black/40 border border-white/10 rounded-lg p-2 outline-none focus:border-astrology-gold"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <input 
              type="date" 
              value={newPred.date} 
              onChange={e => setNewPred({...newPred, date: e.target.value})}
              className="bg-black/40 border border-white/10 rounded-lg p-2 outline-none focus:border-astrology-gold"
            />
            <textarea 
              placeholder="Prediction content..."
              className="md:col-span-2 bg-black/40 border border-white/10 rounded-lg p-2 h-24 outline-none focus:border-astrology-gold"
              value={newPred.content}
              onChange={e => setNewPred({...newPred, content: e.target.value})}
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-astrology-gold text-black px-4 py-2 rounded-lg font-bold">Save</button>
              <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-white/5">
        {['daily', 'weekly', 'monthly', 'yearly'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 capitalize transition-all ${activeTab === tab ? 'text-astrology-gold border-b-2 border-astrology-gold font-bold' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-astrology-card rounded-xl border border-astrology-gold/10 overflow-x-auto shadow-2xl">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-black/20 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Rasi</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
               <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading predictions...</td></tr>
            ) : predictions.filter(p => p.type === activeTab).length === 0 ? (
               <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No {activeTab} predictions found</td></tr>
            ) : predictions.filter(p => p.type === activeTab).map(pred => (
              <tr key={pred.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-bold text-astrology-gold">{pred.rasi}</td>
                <td className="px-6 py-4 text-gray-400">{new Date(pred.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/10 text-green-500">
                    Published
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-3 text-gray-500">
                  <button className="hover:text-astrology-gold"><Edit2 size={16} /></button>
                  <button className="hover:text-red-500"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RasiPalan
