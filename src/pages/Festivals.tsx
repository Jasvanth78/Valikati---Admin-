import React, { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Trash2, Calendar as CalendarIcon, Image as ImageIcon, Upload, AlertTriangle, Check, X } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'
import * as XLSX from 'xlsx'
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

  const [previewData, setPreviewData] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
               return lower === 'name' || lower === 'date';
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
           throw new Error("Could not find a header row. Ensure columns like 'name', 'date' exist.");
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

          let nameStr = rowObj['name'] || '';
          if (!nameStr) {
            errors.push(`Row ${i + 1}: Missing name`);
            continue;
          }

          parsedRecords.push({
            name: String(nameStr),
            date: entryDate,
            description: String(rowObj['description'] || ''),
            imageUrl: String(rowObj['imageurl'] || rowObj['image_url'] || ''),
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
      const response = await fetch(`${API_BASE_URL}/api/admin/festivals/bulk`, {
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
        fetchFestivals();
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
          <h2 className="text-3xl font-bold text-astrology-gold">Festival Management</h2>
          <p className="text-gray-400 font-['Inter']">Add and manage upcoming festivals with custom images and details.</p>
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
            onClick={() => {
              setEditingId(null)
              setFestForm(emptyFest)
              setIsAdding(true)
            }}
            className="btn-gold flex items-center gap-2 flex-1 md:flex-none justify-center"
          >
            <Plus size={18} />
            New Festival
          </button>
        </div>
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
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {previewData.slice(0, 15).map((row, i) => (
                          <tr key={i} className="hover:bg-white/5">
                            <td className="px-4 py-3 whitespace-nowrap">{row.date}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{row.name}</td>
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

    </div>
  )
}

export default Festivals
