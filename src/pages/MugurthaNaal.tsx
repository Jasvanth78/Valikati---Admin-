import React, { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Trash2, Calendar as CalendarIcon, Clock, X, Search, Sparkles, Heart, Home, Navigation, Star, Upload, AlertTriangle, Check } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'
import * as XLSX from 'xlsx'

const CATEGORIES = [
  { key: 'marriage', label: 'Marriage (திருமணம்)', icon: Heart, badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  { key: 'house_opening', label: 'House Warming (கிரஹபிரவேசம் / வீடு)', icon: Home, badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { key: 'travel', label: 'Travel / Vehicle (பயணம் / வாகன பூஜை)', icon: Navigation, badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { key: 'general', label: 'General Suba Mugurtham (பொது முகூர்த்தம்)', icon: Star, badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
]

const MugurthaNaal = () => {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false)
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

  const [previewData, setPreviewData] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        if (!workbook.SheetNames.length) throw new Error("Excel file is empty");

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (rawRows.length === 0) throw new Error("Worksheet contains no data");

        let headerRowIndex = -1;
        let headerNames: string[] = [];
        
        for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
          const row = rawRows[i];
          if (!Array.isArray(row)) continue;
          
          const isHeader = row.some(cell => {
             if (typeof cell === 'string') {
               const lower = cell.trim().toLowerCase();
               return lower === 'date' || lower === 'time';
             }
             return false;
          });
          
          if (isHeader) {
            headerRowIndex = i;
            headerNames = row.map(col => typeof col === 'string' ? col.trim().toLowerCase() : String(col || '').toLowerCase());
            break;
          }
        }

        if (headerRowIndex === -1) {
           throw new Error("Could not find a header row. Ensure columns like 'date', 'time' exist.");
        }

        const parsedRecords: any[] = [];
        const errors: string[] = [];

        for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;
          
          const rowObj: any = {};
          let isEmptyRow = true;
          
          headerNames.forEach((header, index) => {
             if (header && row[index] !== undefined && row[index] !== null && row[index] !== '') {
               rowObj[header] = row[index];
               isEmptyRow = false;
             }
          });
          
          if (isEmptyRow) continue;

          let entryDate = rowObj['date'];
          if (!entryDate) {
            errors.push(`Row ${i + 1}: Missing date`);
            continue;
          }
          if (entryDate instanceof Date) {
            entryDate.setMinutes(entryDate.getMinutes() - entryDate.getTimezoneOffset());
            entryDate = entryDate.toISOString().split('T')[0];
          }

          let timeStr = rowObj['time'] || '';
          if (!timeStr) {
            errors.push(`Row ${i + 1}: Missing time`);
            continue;
          }

          parsedRecords.push({
            date: entryDate,
            time: String(timeStr),
            type: String(rowObj['type'] || 'Valarpirai'),
            description: String(rowObj['description'] || rowObj['category'] || 'Suba Mugurtham'),
            _rawPreview: rowObj
          });
        }

        setValidationErrors(errors);
        
        if (errors.length === 0 && parsedRecords.length > 0) {
          setPreviewData(parsedRecords);
          setShowPreview(true);
        } else if (errors.length > 0) {
          setShowPreview(true);
        }

      } catch (error: any) {
        setValidationErrors([error.message || 'Error parsing Excel file']);
        setShowPreview(true);
      }
    };

    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmUpload = async () => {
    if (previewData.length === 0) return;
    setIsUploading(true);

    const payload = previewData.map(({ _rawPreview, ...rest }) => rest);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/mugurtham/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        },
        body: JSON.stringify({ data: payload })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully uploaded and processed ${result.count} records.`);
        setShowPreview(false);
        setPreviewData([]);
        fetchEntries();
      } else {
        const err = await response.json();
        alert(`Upload failed: ${err.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading Excel data:', error);
      alert('A network error occurred while uploading.');
    } finally {
      setIsUploading(false);
    }
  };


  const handleDeleteAll = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/mugurtham/all`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') }
      })
      if (response.ok) {
        setIsDeleteAllModalOpen(false)
        fetchEntries()
      } else {
        alert('Failed to delete all data')
      }
    } catch (error) {
      console.error('Error deleting all data:', error)
    }
  }

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
        <div className="flex gap-2 w-full md:w-auto">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleExcelUpload}
            accept=".xlsx, .xls" 
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-transparent border border-astrology-gold text-astrology-gold hover:bg-astrology-gold hover:text-black px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 flex-1 md:flex-none transition-colors"
          >
            <Upload size={18} />
            Upload Excel
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-astrology-gold text-black px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 flex-1 md:flex-none shadow-lg shadow-astrology-gold/20 hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            New Day
          </button>
        </div>
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

      {showPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B101A] border border-astrology-gold/30 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-bold text-astrology-gold flex items-center gap-2">
                <Upload size={24} />
                Preview Upload Data
              </h3>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {validationErrors.length > 0 ? (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                  <h4 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    Validation Errors ({validationErrors.length})
                  </h4>
                  <ul className="list-disc pl-5 text-red-200/80 space-y-1 text-sm">
                    {validationErrors.slice(0, 10).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {validationErrors.length > 10 && (
                      <li>...and {validationErrors.length - 10} more errors</li>
                    )}
                  </ul>
                  <p className="text-xs text-gray-400 mt-4">Please fix these errors in your Excel file and try uploading again.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 text-green-400 flex items-center gap-3">
                    <Check size={20} />
                    <p>Successfully parsed {previewData.length} records. Ready to upload.</p>
                  </div>
                  
                  <div className="overflow-x-auto rounded-lg border border-white/10">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead className="bg-white/5 text-astrology-gold uppercase text-xs">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Time</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {previewData.slice(0, 15).map((row, i) => (
                          <tr key={i} className="hover:bg-white/5">
                            <td className="px-4 py-3 whitespace-nowrap">{row.date}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{row.time}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{row.type}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{row.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewData.length > 15 && (
                    <div className="text-center text-sm text-gray-500 py-2">
                      Showing 15 of {previewData.length} records
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-black/20">
              <button 
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                disabled={isUploading}
              >
                Cancel
              </button>
              {validationErrors.length === 0 && (
                <button 
                  onClick={confirmUpload}
                  disabled={isUploading}
                  className="px-6 py-2 rounded-lg font-bold bg-astrology-gold text-black hover:bg-yellow-400 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Confirm Upload'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-astrology-card p-6 rounded-xl border border-red-500/30 shadow-2xl max-w-md w-full">
            <div className="flex items-center gap-4 text-red-400 mb-4">
              <AlertTriangle size={32} />
              <h3 className="text-xl font-bold">WARNING: Delete All Data</h3>
            </div>
            <p className="text-gray-300 mb-6 font-['Inter']">
              Are you sure you want to delete ALL data in this section? This action is permanent and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold"
              >
                Yes, Delete All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MugurthaNaal
