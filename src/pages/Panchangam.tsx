import React, { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Trash2, Calendar as CalendarIcon, Sun, Moon, Sparkles, Clock, AlertTriangle, Upload, X, Check } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'
import * as XLSX from 'xlsx'

interface PanchangamEntry {
  id?: string
  date: string
  sunrise: string
  sunset: string
  tithi?: string
  nakshatram?: string
  yogam?: string
  karanam?: string
  details?: string
  nallaNeram?: string
  gowriNallaNeram?: string
  rahuKalam?: string
  yemagandam?: string
  kuligai?: string
}

const emptyForm: PanchangamEntry = {
  date: new Date().toISOString().split('T')[0],
  sunrise: '06:00 AM',
  sunset: '06:00 PM',
  tithi: '',
  nakshatram: '',
  yogam: '',
  karanam: '',
  details: '',
  nallaNeram: '',
  gowriNallaNeram: '',
  rahuKalam: '',
  yemagandam: '',
  kuligai: ''
}

const Panchangam = () => {
  const [entries, setEntries] = useState<PanchangamEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<PanchangamEntry>(emptyForm)

  const [previewData, setPreviewData] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchPanchangam()
  }, [])

  const fetchPanchangam = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/panchangam`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
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

  const handleOpenAdd = () => {
    setEditingId(null)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      sunrise: '06:00 AM',
      sunset: '06:00 PM',
      tithi: 'வளர்பிறை பிரதமை',
      nakshatram: 'உத்திராடம்',
      yogam: 'சுபம்',
      karanam: 'பவம்',
      details: '',
      nallaNeram: '09:15 AM - 10:15 AM | 04:45 PM - 05:45 PM',
      gowriNallaNeram: '10:30 AM - 11:30 AM',
      rahuKalam: '01:30 PM - 03:00 PM',
      yemagandam: '06:00 AM - 07:30 AM',
      kuligai: '09:00 AM - 10:30 AM'
    })
    setIsFormOpen(true)
  }

  const handleOpenEdit = (entry: PanchangamEntry) => {
    setEditingId(entry.id || null)
    let formattedDate = entry.date
    if (entry.date && entry.date.includes('T')) {
      formattedDate = entry.date.split('T')[0]
    }
    setFormData({
      id: entry.id,
      date: formattedDate,
      sunrise: entry.sunrise || '06:00 AM',
      sunset: entry.sunset || '06:00 PM',
      tithi: entry.tithi || '',
      nakshatram: entry.nakshatram || '',
      yogam: entry.yogam || '',
      karanam: entry.karanam || '',
      details: entry.details || '',
      nallaNeram: entry.nallaNeram || '',
      gowriNallaNeram: entry.gowriNallaNeram || '',
      rahuKalam: entry.rahuKalam || '',
      yemagandam: entry.yemagandam || '',
      kuligai: entry.kuligai || ''
    })
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const isEdit = Boolean(editingId)
      const url = isEdit
        ? `${API_BASE_URL}/api/admin/panchangam/${editingId}`
        : `${API_BASE_URL}/api/admin/panchangam`
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsFormOpen(false)
        setEditingId(null)
        setFormData(emptyForm)
        fetchPanchangam()
      }
    } catch (error) {
      console.error('Error saving panchangam entry:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Panchangam entry?')) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/panchangam/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
      if (response.ok) {
        fetchPanchangam()
      }
    } catch (error) {
      console.error('Error deleting panchangam entry:', error)
    }
  }

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
               return lower === 'date' || lower === 'sunrise';
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
           throw new Error("Could not find a header row. Ensure columns like 'date', 'sunrise' exist.");
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

          parsedRecords.push({
            date: entryDate,
            sunrise: String(rowObj['sunrise'] || '06:00 AM'),
            sunset: String(rowObj['sunset'] || '06:00 PM'),
            tithi: String(rowObj['tithi'] || ''),
            nakshatram: String(rowObj['nakshatram'] || ''),
            yogam: String(rowObj['yogam'] || ''),
            karanam: String(rowObj['karanam'] || ''),
            details: String(rowObj['details'] || ''),
            nallaNeram: String(rowObj['nallaneram'] || rowObj['nalla_neram'] || ''),
            gowriNallaNeram: String(rowObj['gowrinallaneram'] || rowObj['gowri_nalla_neram'] || ''),
            rahuKalam: String(rowObj['rahukalam'] || rowObj['rahu_kalam'] || ''),
            yemagandam: String(rowObj['yemagandam'] || ''),
            kuligai: String(rowObj['kuligai'] || ''),
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
      const response = await fetch(`${API_BASE_URL}/api/admin/panchangam/bulk`, {
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
        fetchPanchangam();
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

  return (
    <div className="font-['Inter']">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 font-['Outfit']">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-astrology-gold">Panchangam Management (பஞ்சாங்கம்)</h2>
          <p className="text-gray-400 text-sm md:text-base font-['Inter']">Manage daily Sunrise, Sunset, Tithi, Nakshatram, Auspicious & Inauspicious timings.</p>
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
            className="btn-gold flex items-center gap-2 flex-1 md:flex-none justify-center bg-transparent border border-astrology-gold text-astrology-gold hover:bg-astrology-gold hover:text-black"
          >
            <Upload size={18} />
            Upload Excel
          </button>
          <button 
            onClick={handleOpenAdd}
            className="btn-gold flex items-center gap-2 flex-1 md:flex-none justify-center"
          >
            <Plus size={18} />
            New Entry
          </button>
        </div>
      </header>

      {isFormOpen && (
        <div className="mb-8 bg-astrology-card p-6 rounded-xl border border-astrology-gold/30 shadow-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h3 className="text-xl font-bold text-astrology-gold font-['Outfit']">
              {editingId ? 'Edit Panchangam Details' : 'Add New Panchangam Entry'}
            </h3>
            <button 
              type="button" 
              onClick={() => setIsFormOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Top row: Date, Sunrise, Sunset */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-astrology-gold mb-1 font-bold">Date</label>
                <input 
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-orange-400 mb-1 font-bold">Sunrise (சூரியோதயம்)</label>
                <input 
                  type="text"
                  placeholder="e.g. 06:00 AM"
                  value={formData.sunrise}
                  onChange={(e) => setFormData({...formData, sunrise: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-blue-400 mb-1 font-bold">Sunset (சூரியாஸ்தமனம்)</label>
                <input 
                  type="text"
                  placeholder="e.g. 06:00 PM"
                  value={formData.sunset}
                  onChange={(e) => setFormData({...formData, sunset: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  required
                />
              </div>
            </div>

            {/* Thithi & Nakshatram Section */}
            <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
              <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} />
                திதி & நட்சத்திரம் (Tithi, Star, Yogam & Karanam)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Tithi (திதி)</label>
                  <input 
                    type="text"
                    placeholder="e.g. வளர்பிறை பிரதமை"
                    value={formData.tithi || ''}
                    onChange={(e) => setFormData({...formData, tithi: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Nakshatram (நட்சத்திரம்)</label>
                  <input 
                    type="text"
                    placeholder="e.g. உத்திராடம்"
                    value={formData.nakshatram || ''}
                    onChange={(e) => setFormData({...formData, nakshatram: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Yogam (யோகம்)</label>
                  <input 
                    type="text"
                    placeholder="e.g. சுபம்"
                    value={formData.yogam || ''}
                    onChange={(e) => setFormData({...formData, yogam: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Karanam (கரணம்)</label>
                  <input 
                    type="text"
                    placeholder="e.g. பவம்"
                    value={formData.karanam || ''}
                    onChange={(e) => setFormData({...formData, karanam: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Auspicious Times Section */}
            <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
              <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} />
                சுப நேரங்கள் (Auspicious Timings)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Nalla Neram (நல்ல நேரம்)</label>
                  <input 
                    type="text"
                    placeholder="e.g. 09:15 AM - 10:15 AM | 04:45 PM - 05:45 PM"
                    value={formData.nallaNeram || ''}
                    onChange={(e) => setFormData({...formData, nallaNeram: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Gowri Nalla Neram (கௌரி நல்ல நேரம்)</label>
                  <input 
                    type="text"
                    placeholder="e.g. 10:30 AM - 11:30 AM"
                    value={formData.gowriNallaNeram || ''}
                    onChange={(e) => setFormData({...formData, gowriNallaNeram: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Inauspicious Times Section */}
            <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
              <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={16} />
                ராகு காலம் & எமகண்டம் (Inauspicious Times)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Rahu Kalam (ராகு காலம்)</label>
                  <input 
                    type="text"
                    placeholder="e.g. 01:30 PM - 03:00 PM"
                    value={formData.rahuKalam || ''}
                    onChange={(e) => setFormData({...formData, rahuKalam: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Yemagandam (எமகண்டம்)</label>
                  <input 
                    type="text"
                    placeholder="e.g. 06:00 AM - 07:30 AM"
                    value={formData.yemagandam || ''}
                    onChange={(e) => setFormData({...formData, yemagandam: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Kuligai (குளிகை)</label>
                  <input 
                    type="text"
                    placeholder="e.g. 09:00 AM - 10:30 AM"
                    value={formData.kuligai || ''}
                    onChange={(e) => setFormData({...formData, kuligai: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* General Details Notes */}
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-bold">Additional Details / Summary (விவரங்கள்)</label>
              <textarea 
                placeholder="Additional notes or astronomical summary..."
                value={formData.details || ''}
                onChange={(e) => setFormData({...formData, details: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-astrology-gold outline-none min-h-[60px]"
              ></textarea>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-6 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-sm font-bold text-gray-400"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-gold px-8 py-2 rounded-lg text-sm font-bold"
              >
                {editingId ? 'Update Entry' : 'Save Entry'}
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
                <div className="text-lg font-bold text-astrology-gold font-['Outfit']">
                  {new Date(entry.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="flex items-center gap-1.5 text-orange-400 mb-1 font-bold">
                  <Sun size={14} /> Sunrise / Sunset
                </div>
                <div className="text-gray-300">🌅 {entry.sunrise}</div>
                <div className="text-gray-300">🌇 {entry.sunset}</div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-purple-300 mb-1 font-bold">
                  <Sparkles size={14} /> திதி & நட்சத்திரம்
                </div>
                <div className="text-gray-300"><strong>திதி:</strong> {entry.tithi || '-'}</div>
                <div className="text-gray-300"><strong>நட்சத்திரம்:</strong> {entry.nakshatram || '-'}</div>
                {(entry.yogam || entry.karanam) && (
                  <div className="text-gray-400 text-[11px]">Yog: {entry.yogam || '-'} | Kar: {entry.karanam || '-'}</div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-emerald-400 mb-1 font-bold">
                  <Clock size={14} /> சுப நேரங்கள்
                </div>
                <div className="text-gray-300"><strong>நல்ல நேரம்:</strong> {entry.nallaNeram || '-'}</div>
                <div className="text-gray-300"><strong>கௌரி:</strong> {entry.gowriNallaNeram || '-'}</div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-red-400 mb-1 font-bold">
                  <AlertTriangle size={14} /> தவிர்க்க வேண்டியவை
                </div>
                <div className="text-gray-300"><strong>ராகு:</strong> {entry.rahuKalam || '-'}</div>
                <div className="text-gray-300"><strong>எமகண்டம்:</strong> {entry.yemagandam || '-'}</div>
                <div className="text-gray-300"><strong>குளிகை:</strong> {entry.kuligai || '-'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:border-l border-white/5 md:pl-4 justify-end">
              <button 
                onClick={() => handleOpenEdit(entry)}
                className="p-2 hover:bg-astrology-gold/10 rounded-lg text-gray-400 hover:text-astrology-gold transition-all"
                title="Edit"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => entry.id && handleDelete(entry.id)}
                className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
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
                          <th className="px-4 py-3">Sunrise / Sunset</th>
                          <th className="px-4 py-3">Tithi & Nakshatram</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {previewData.slice(0, 15).map((row, i) => (
                          <tr key={i} className="hover:bg-white/5">
                            <td className="px-4 py-3 whitespace-nowrap">{row.date}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{row.sunrise} / {row.sunset}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{row.tithi} - {row.nakshatram}</td>
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

    </div>
  )
}

export default Panchangam
