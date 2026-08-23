import React, { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Trash2, Sunrise, Sunset, Star, AlertTriangle, Clock, Upload, X, Check } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'
import * as XLSX from 'xlsx'

interface NallaNeramEntry {
  id?: string
  date: string
  morning: string
  evening: string
  gowriMorning?: string
  gowriEvening?: string
  rahuKalam?: string
  yemagandam?: string
  kuligai?: string
}

const emptyForm: NallaNeramEntry = {
  date: new Date().toISOString().split('T')[0],
  morning: '',
  evening: '',
  gowriMorning: '',
  gowriEvening: '',
  rahuKalam: '',
  yemagandam: '',
  kuligai: ''
}

const NallaNeram = () => {
  const [entries, setEntries] = useState<NallaNeramEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<NallaNeramEntry>(emptyForm)

  const [previewData, setPreviewData] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/nalla-neram`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
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

  const handleOpenAdd = () => {
    setEditingId(null)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      morning: '09:00 AM - 10:30 AM',
      evening: '04:30 PM - 06:00 PM',
      gowriMorning: '10:30 AM - 11:30 AM',
      gowriEvening: '06:30 PM - 07:30 PM',
      rahuKalam: '01:30 PM - 03:00 PM',
      yemagandam: '06:00 AM - 07:30 AM',
      kuligai: '09:00 AM - 10:30 AM'
    })
    setIsFormOpen(true)
  }

  const handleOpenEdit = (entry: NallaNeramEntry) => {
    setEditingId(entry.id || null)
    let formattedDate = entry.date
    if (entry.date && entry.date.includes('T')) {
      formattedDate = entry.date.split('T')[0]
    }
    setFormData({
      id: entry.id,
      date: formattedDate,
      morning: entry.morning || '',
      evening: entry.evening || '',
      gowriMorning: entry.gowriMorning || '',
      gowriEvening: entry.gowriEvening || '',
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
        ? `${API_BASE_URL}/api/admin/nalla-neram/${editingId}`
        : `${API_BASE_URL}/api/admin/nalla-neram`
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
        fetchEntries()
      }
    } catch (error) {
      console.error('Error saving nalla neram:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Nalla Neram entry?')) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/nalla-neram/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
      if (response.ok) {
        fetchEntries()
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
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
               return lower === 'date' || lower === 'morning' || lower === 'evening';
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
           throw new Error("Could not find a header row. Ensure columns like 'date', 'morning' exist.");
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
               const cleanKey = header.replace(/[^a-z0-9]/g, '');
               rowObj[cleanKey] = row[index];
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
          } else if (typeof entryDate === 'string') {
            const parts = entryDate.split(/[-/]/);
            if (parts.length === 3) {
              if (parts[0].length <= 2 && parts[2].length === 4) {
                entryDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              } else if (parts[0].length === 4) {
                entryDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              }
            }
          }

          parsedRecords.push({
            date: entryDate,
            morning: String(rowObj['morningnallaneram'] || rowObj['morning'] || ''),
            evening: String(rowObj['eveningnallaneram'] || rowObj['evening'] || ''),
            gowriMorning: String(rowObj['gowrimorning'] || ''),
            gowriEvening: String(rowObj['gowrievening'] || ''),
            rahuKalam: String(rowObj['rahukalam'] || ''),
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
      const response = await fetch(`${API_BASE_URL}/api/admin/nalla-neram/bulk`, {
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

  return (
    <div className="font-['Inter']">
      <header className="flex justify-between items-center mb-8 font-['Outfit']">
        <div>
          <h2 className="text-3xl font-bold text-astrology-gold">Nalla Neram (நல்ல நேரம்)</h2>
          <p className="text-gray-400 font-['Inter']">Manage daily auspicious times, Gowri Nalla Neram, and inauspicious timings.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleExcelUpload}
            accept=".xlsx, .xls" 
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="btn-gold flex items-center gap-2 bg-transparent border border-astrology-gold text-astrology-gold hover:bg-astrology-gold hover:text-black"
          >
            <Upload size={18} />
            Upload Excel
          </button>
          <button 
            onClick={handleOpenAdd}
            className="btn-gold flex items-center gap-2"
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
              {editingId ? 'Edit Auspicious Timings' : 'Add Daily Auspicious & Inauspicious Timings'}
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
            {/* Date Section */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-astrology-gold mb-1 font-bold">Date</label>
              <input 
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full md:w-1/3 bg-black/40 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-astrology-gold"
                required
              />
            </div>

            {/* Auspicious Time Section */}
            <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
              <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
                <Sunrise size={16} />
                நல்ல நேரம் (Auspicious Times)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Morning (காலை நல்ல நேரம்)</label>
                  <input 
                    type="text" 
                    value={formData.morning}
                    onChange={(e) => setFormData({...formData, morning: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-astrology-gold"
                    placeholder="e.g. 09:00 AM - 10:30 AM"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Evening (மாலை நல்ல நேரம்)</label>
                  <input 
                    type="text" 
                    value={formData.evening}
                    onChange={(e) => setFormData({...formData, evening: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-astrology-gold"
                    placeholder="e.g. 04:30 PM - 06:00 PM"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Gowri Nalla Neram Section */}
            <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Star size={16} />
                கௌரி நல்ல நேரம் (Gowri Auspicious Times)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Gowri Morning (காலை கௌரி)</label>
                  <input 
                    type="text" 
                    value={formData.gowriMorning || ''}
                    onChange={(e) => setFormData({...formData, gowriMorning: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-astrology-gold"
                    placeholder="e.g. 10:30 AM - 11:30 AM"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Gowri Evening (மாலை கௌரி)</label>
                  <input 
                    type="text" 
                    value={formData.gowriEvening || ''}
                    onChange={(e) => setFormData({...formData, gowriEvening: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-astrology-gold"
                    placeholder="e.g. 06:30 PM - 07:30 PM"
                  />
                </div>
              </div>
            </div>

            {/* Inauspicious Times Section */}
            <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
              <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={16} />
                தவிர்க்க வேண்டிய நேரங்கள் (Inauspicious Times)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Rahu Kalam (ராகு காலம்)</label>
                  <input 
                    type="text" 
                    value={formData.rahuKalam || ''}
                    onChange={(e) => setFormData({...formData, rahuKalam: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-astrology-gold"
                    placeholder="e.g. 01:30 PM - 03:00 PM"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Yemagandam (எமகண்டம்)</label>
                  <input 
                    type="text" 
                    value={formData.yemagandam || ''}
                    onChange={(e) => setFormData({...formData, yemagandam: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-astrology-gold"
                    placeholder="e.g. 06:00 AM - 07:30 AM"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Kuligai (குளிகை)</label>
                  <input 
                    type="text" 
                    value={formData.kuligai || ''}
                    onChange={(e) => setFormData({...formData, kuligai: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-astrology-gold"
                    placeholder="e.g. 09:00 AM - 10:30 AM"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)}
                className="px-6 py-2 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-gold px-8 py-2 rounded-lg font-bold"
              >
                {editingId ? 'Update Entry' : 'Save Entry'}
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
              <th className="px-6 py-4">Auspicious (நல்ல நேரம்)</th>
              <th className="px-6 py-4">Gowri (கௌரி)</th>
              <th className="px-6 py-4">Inauspicious (தவிர்க்க வேண்டியவை)</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading timings...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No timings found.</td></tr>
            ) : entries.map(entry => (
              <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                  {new Date(entry.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                      <Sunrise size={14} />
                      <span><strong>காலை:</strong> {entry.morning || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                      <Sunset size={14} />
                      <span><strong>மாலை:</strong> {entry.evening || '-'}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1 text-xs text-yellow-200/90">
                    <div><strong>காலை:</strong> {entry.gowriMorning || '-'}</div>
                    <div><strong>மாலை:</strong> {entry.gowriEvening || '-'}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1 text-xs text-red-300">
                    <div><strong>ராகு:</strong> {entry.rahuKalam || '-'}</div>
                    <div><strong>எமகண்டம்:</strong> {entry.yemagandam || '-'}</div>
                    <div><strong>குளிகை:</strong> {entry.kuligai || '-'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => handleOpenEdit(entry)}
                      className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-astrology-gold transition-all"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => entry.id && handleDelete(entry.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                          <th className="px-4 py-3">Morning</th>
                          <th className="px-4 py-3">Evening</th>
                          <th className="px-4 py-3">Gowri (M/E)</th>
                          <th className="px-4 py-3">Inauspicious (R/Y/K)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {previewData.slice(0, 15).map((row, i) => (
                          <tr key={i} className="hover:bg-white/5">
                            <td className="px-4 py-3 whitespace-nowrap">{row.date}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{row.morning}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{row.evening}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-yellow-200/90">
                              <div>M: {row.gowriMorning}</div>
                              <div>E: {row.gowriEvening}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-red-300">
                              <div>Rahu: {row.rahuKalam}</div>
                              <div>Yema: {row.yemagandam}</div>
                              <div>Kuli: {row.kuligai}</div>
                            </td>
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

export default NallaNeram
