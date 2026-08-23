import React, { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Trash2, Search, Filter, Upload, FileText, Check, X, Sparkles, ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'
import * as XLSX from 'xlsx'

const RASIS = [
  'Mesham', 'Rishabam', 'Midhunam', 'Kadagam', 
  'Simmam', 'Kanni', 'Thulaam', 'Viruchigam', 
  'Dhanusu', 'Magaram', 'Kumbam', 'Meenam'
]

const RasiPalan = () => {
  const [activeTab, setActiveTab] = useState('daily')
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false)
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

  // New states for Excel Upload
  const [previewData, setPreviewData] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

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

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        if (!workbook.SheetNames.length) {
          throw new Error("Excel file is empty");
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (rawRows.length === 0) {
          throw new Error("Worksheet contains no data");
        }

        // Dynamically find the header row (it could be row 0, 1, 2 etc. if there are titles)
        let headerRowIndex = -1;
        let headerNames: string[] = [];
        
        for (let i = 0; i < Math.min(rawRows.length, 20); i++) { // scan first 20 rows
          const row = rawRows[i];
          if (!Array.isArray(row)) continue;
          
          const isHeader = row.some(cell => {
             if (typeof cell === 'string') {
               const lower = cell.trim().toLowerCase();
               return lower === 'rasi' || lower === 'date';
             }
             return false;
          });
          
          if (isHeader) {
            headerRowIndex = i;
            headerNames = row.map(cell => typeof cell === 'string' ? cell.trim().toLowerCase() : String(cell || '').trim().toLowerCase());
            break;
          }
        }

        if (headerRowIndex === -1) {
           throw new Error("Could not find a valid header row. Please make sure your Excel file has columns named 'Date' and 'Rasi'.");
        }

        // Map data rows to objects using the detected headers
        const json: { normalizedRow: any, originalIndex: number }[] = [];
        for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
          const rowArr = rawRows[i];
          if (!rowArr || rowArr.length === 0) continue;
          
          const rowObj: any = {};
          let hasData = false;
          headerNames.forEach((header, index) => {
            if (header) {
               rowObj[header] = rowArr[index];
               if (rowArr[index] !== undefined && rowArr[index] !== null && String(rowArr[index]).trim() !== '') {
                 hasData = true;
               }
            }
          });
          
          if (hasData) {
            json.push({ normalizedRow: rowObj, originalIndex: i });
          }
        }

        // Validate and Parse
        const errors: string[] = [];
        const parsedRecords: any[] = [];
        const seenRecords = new Set<string>();

        json.forEach(({ normalizedRow, originalIndex }) => {

          const rawDate = normalizedRow['date'];
          const rawRasi = normalizedRow['rasi'];
          const rawType = normalizedRow['type'] || 'daily';
          const general = normalizedRow['general'];
          const work = normalizedRow['work'] || '';
          const money = normalizedRow['money'] || '';
          const health = normalizedRow['health'] || '';
          const love = normalizedRow['love'] || '';

          if (!rawDate) {
            const detectedHeaders = Object.keys(normalizedRow).join(', ');
            errors.push(`Row ${originalIndex + 1}: Missing Date column. (Detected headers: ${detectedHeaders || 'None'})`);
            return;
          }

          let parsedDateString = '';
          if (rawDate instanceof Date) {
            parsedDateString = rawDate.toISOString().split('T')[0];
          } else if (typeof rawDate === 'string') {
            // Attempt to parse YYYY-MM-DD
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) {
              parsedDateString = d.toISOString().split('T')[0];
            } else {
              errors.push(`Row ${originalIndex + 1}: Invalid Date format. Use YYYY-MM-DD`);
              return;
            }
          } else {
            // Excel serial number or other formats
            const d = new Date(Math.round((Number(rawDate) - 25569)*86400*1000));
            if (!isNaN(d.getTime())) {
              parsedDateString = d.toISOString().split('T')[0];
            } else {
               errors.push(`Row ${originalIndex + 1}: Invalid Date`);
               return;
            }
          }

          if (!rawRasi) {
            errors.push(`Row ${originalIndex + 1}: Missing Rasi`);
            return;
          }

          if (!general) {
            errors.push(`Row ${originalIndex + 1}: Missing General prediction`);
            return;
          }

          // Normalize Rasi
          const normalizedRasi = RASIS.find(r => r.toLowerCase() === String(rawRasi).trim().toLowerCase());
          if (!normalizedRasi) {
            errors.push(`Row ${originalIndex + 1}: Invalid Rasi '${rawRasi}'`);
            return;
          }

          const typeString = String(rawType).toLowerCase().trim();
          const uniqueKey = `${parsedDateString}_${normalizedRasi}_${typeString}`;

          if (seenRecords.has(uniqueKey)) {
            errors.push(`Row ${originalIndex + 1}: Duplicate entry for Date ${parsedDateString}, Rasi ${normalizedRasi}, Type ${typeString}`);
            return;
          }
          seenRecords.add(uniqueKey);

          let payloadContent = String(general).trim();
          if (work || money || health || love) {
            payloadContent = JSON.stringify({
              general: String(general).trim(),
              work: String(work || '').trim(),
              money: String(money || '').trim(),
              health: String(health || '').trim(),
              love: String(love || '').trim(),
            });
          }

          parsedRecords.push({
            rasi: normalizedRasi,
            type: typeString,
            content: payloadContent,
            date: parsedDateString,
            _rawPreview: {
              general: String(general).trim(),
              work: String(work || '').trim(),
              money: String(money || '').trim(),
              health: String(health || '').trim(),
              love: String(love || '').trim(),
            }
          });
        });

        setValidationErrors(errors);
        
        if (errors.length === 0 && parsedRecords.length > 0) {
          setPreviewData(parsedRecords);
          setShowPreview(true);
        } else if (errors.length > 0) {
          setShowPreview(true); // show errors in preview modal
        }

      } catch (error: any) {
        setValidationErrors([error.message || 'Error parsing Excel file']);
        setShowPreview(true);
      }
    };

    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
  };

  const confirmUpload = async () => {
    if (previewData.length === 0) return;
    setIsUploading(true);

    // Strip out _rawPreview before sending to backend
    const payload = previewData.map(({ _rawPreview, ...rest }) => rest);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/rasi-palan/bulk`, {
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
        fetchPredictions();
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

  // Group preview data by Date for the summary
  const groupedPreview = previewData.reduce((acc, curr) => {
    if (!acc[curr.date]) acc[curr.date] = [];
    acc[curr.date].push(curr);
    return acc;
  }, {} as Record<string, any[]>);

  // Filtered Predictions
  const filteredPredictions = predictions
    .filter(p => p.type === activeTab)
    .filter(p => selectedRasiFilter === 'all' || p.rasi === selectedRasiFilter)
    .filter(p => 
      p.rasi.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.content.toLowerCase().includes(searchQuery.toLowerCase())
    )


  const handleDeleteAll = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/rasi-palan/all`, {
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
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-astrology-gold font-['Outfit'] flex items-center gap-2">
            <Sparkles className="text-astrology-gold" size={28} />
            Rasi Palan Management
          </h2>
          <p className="text-gray-400 text-sm md:text-base">Publish and manage daily, weekly, monthly, and yearly horoscope predictions.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto bg-black/30 p-2 rounded-xl border border-white/5">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleExcelUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white/10 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-white/10 hover:bg-white/20 transition-colors"
          >
            <Upload size={18} />
            Upload Excel
          </button>
          
          <button 
            onClick={() => {
              setIsAdding(true);
              setNewPred(prev => ({ ...prev, type: activeTab }));
            }}
            className="bg-astrology-gold text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-astrology-gold/20 hover:opacity-90 transition-opacity ml-auto lg:ml-0"
          >
            <Plus size={18} />
            Add Prediction
          </button>
        </div>
      </header>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-astrology-card border border-astrology-gold/30 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-start shrink-0">
              <div>
                <h3 className="text-2xl font-bold text-astrology-gold font-['Outfit']">Excel Data Preview</h3>
                <p className="text-gray-400 text-sm mt-1">Review the parsed predictions before saving to the database.</p>
              </div>
              <button 
                onClick={() => setShowPreview(false)} 
                className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grow">
              {validationErrors.length > 0 ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                  <h4 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                    <X size={18} /> Validation Errors
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((err, i) => (
                      <li key={i} className="text-red-200 text-sm">{err}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-400 mt-4">Please fix these errors in your Excel file and try uploading again.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-green-400 font-bold flex items-center gap-2">
                      <Check size={18} /> Data Parsed Successfully
                    </span>
                    <span className="text-white text-sm font-bold bg-green-500/20 px-3 py-1 rounded-full">
                      {previewData.length} Total Records
                    </span>
                  </div>
                  
                  {/* Detailed Data Table */}
                  <div className="bg-black/30 rounded-xl border border-white/10 overflow-hidden">
                    <div className="overflow-x-auto max-h-[50vh]">
                      <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-white/5 text-gray-400 uppercase text-xs sticky top-0 backdrop-blur-md z-10">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Date</th>
                            <th className="px-4 py-3 font-semibold">Rasi</th>
                            <th className="px-4 py-3 font-semibold">Type</th>
                            <th className="px-4 py-3 font-semibold w-1/3">General</th>
                            <th className="px-4 py-3 font-semibold">Aspects (Work/Money/Health/Love)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {previewData.map((rec, i) => {
                            const hasAspects = rec._rawPreview.work || rec._rawPreview.money || rec._rawPreview.health || rec._rawPreview.love;
                            return (
                              <tr key={i} className="hover:bg-white/5">
                                <td className="px-4 py-3 text-sm text-white whitespace-nowrap">{rec.date}</td>
                                <td className="px-4 py-3 text-sm font-bold text-astrology-gold">{rec.rasi}</td>
                                <td className="px-4 py-3 text-xs text-gray-400 capitalize">{rec.type}</td>
                                <td className="px-4 py-3 text-xs text-gray-300">
                                  <div className="max-w-xs line-clamp-2" title={rec._rawPreview.general}>{rec._rawPreview.general}</div>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-400">
                                  {hasAspects ? (
                                    <div className="space-y-1">
                                      {rec._rawPreview.work && <div className="truncate max-w-[200px]" title={rec._rawPreview.work}><span className="text-blue-400">Work:</span> {rec._rawPreview.work}</div>}
                                      {rec._rawPreview.money && <div className="truncate max-w-[200px]" title={rec._rawPreview.money}><span className="text-green-400">Money:</span> {rec._rawPreview.money}</div>}
                                      {rec._rawPreview.health && <div className="truncate max-w-[200px]" title={rec._rawPreview.health}><span className="text-red-400">Health:</span> {rec._rawPreview.health}</div>}
                                      {rec._rawPreview.love && <div className="truncate max-w-[200px]" title={rec._rawPreview.love}><span className="text-pink-400">Love:</span> {rec._rawPreview.love}</div>}
                                    </div>
                                  ) : (
                                    <span className="italic opacity-50">None</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                     <h4 className="text-sm text-gray-400 font-bold mb-1">Notice:</h4>
                     <p className="text-xs text-gray-300">Existing records for the displayed dates and Rasis will be safely replaced to prevent duplicates.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-black/20 flex gap-3 justify-end shrink-0">
              <button 
                onClick={() => setShowPreview(false)}
                className="px-6 py-2.5 rounded-lg font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors"
                disabled={isUploading}
              >
                Cancel
              </button>
              {validationErrors.length === 0 && (
                <button 
                  onClick={confirmUpload}
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-lg font-bold bg-astrology-gold text-black hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Confirm Upload'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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

export default RasiPalan
