import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Home, Image as ImageIcon, X, AlertTriangle, Eye } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'
import { ImageUploader } from '../components/ImageUploader'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

interface SakunamForm {
  id?: string
  category: string
  titleTa: string
  titleEn: string
  contentTa: string
  contentEn: string
  imageUrl: string
}

const emptySakunamForm: SakunamForm = {
  category: 'kagam', // default
  titleTa: '',
  titleEn: '',
  contentTa: '',
  contentEn: '',
  imageUrl: '',
}

const CATEGORIES = [
  { value: 'kagam', label: 'காகம் (Crow)' },
  { value: 'palli_sollum', label: 'பல்லி சொல்லும் பலன் (Lizard Chirping)' },
  { value: 'palli_vilum', label: 'பல்லி விழும் பலன் (Lizard Falling)' },
  { value: 'aanthai', label: 'ஆந்தை (Owl)' },
]

const Sakunam = () => {
  const [sakunamList, setSakunamList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [sakunamForm, setSakunamForm] = useState<SakunamForm>(emptySakunamForm)
  const [saving, setSaving] = useState(false)
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all')

  useEffect(() => {
    fetchSakunamList()
  }, [])

  const fetchSakunamList = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/sakunam`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
      if (response.ok) {
        const data = await response.json()
        setSakunamList(data)
      }
    } catch (error) {
      console.error('Error fetching Sakunam:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sakunamForm.titleTa && !sakunamForm.titleEn) {
      alert('Please provide at least one title.')
      return
    }
    if (!sakunamForm.contentTa && !sakunamForm.contentEn) {
      alert('Please provide content.')
      return
    }

    setSaving(true)
    const isEdit = !!editingId
    const url = isEdit 
      ? `${API_BASE_URL}/api/admin/sakunam/${editingId}`
      : `${API_BASE_URL}/api/admin/sakunam`
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        },
        body: JSON.stringify(sakunamForm)
      })
      if (response.ok) {
        setIsFormOpen(false)
        setEditingId(null)
        setSakunamForm(emptySakunamForm)
        fetchSakunamList()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error || 'Failed to save Sakunam entry'}`)
      }
    } catch (error: any) {
      console.error('Error saving Sakunam:', error)
      alert(`Error saving Sakunam: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (sakunam: any) => {
    setSakunamForm({
      id: sakunam.id,
      category: sakunam.category || 'kagam',
      titleTa: sakunam.titleTa || '',
      titleEn: sakunam.titleEn || '',
      contentTa: sakunam.contentTa || '',
      contentEn: sakunam.contentEn || '',
      imageUrl: sakunam.imageUrl || '',
    })
    setEditingId(sakunam.id)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete Sakunam entry: "${title}"?`)) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/sakunam/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
      if (response.ok) {
        fetchSakunamList()
      }
    } catch (error) {
      console.error('Error deleting Sakunam:', error)
    }
  }

  const handleDeleteAll = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/sakunam/all`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') }
      })
      if (response.ok) {
        setIsDeleteAllModalOpen(false)
        fetchSakunamList()
      } else {
        alert('Failed to delete all data')
      }
    } catch (error) {
      console.error('Error deleting all data:', error)
    }
  }

  const filteredSakunamList = selectedFilterCategory === 'all' 
    ? sakunamList 
    : sakunamList.filter(s => s.category === selectedFilterCategory);

  return (
    <div className="font-['Inter'] space-y-6">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 font-['Outfit']">
        <div>
          <h2 className="text-3xl font-bold text-astrology-gold flex items-center gap-2">
            <Eye className="w-8 h-8 text-astrology-gold" />
            Sakunam Management
          </h2>
          <p className="text-gray-400">Publish omens and signs (Crow, Lizard, Owl) to the mobile app.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null)
            setSakunamForm(emptySakunamForm)
            setIsFormOpen(true)
          }}
          className="flex items-center gap-2 bg-gold-gradient text-astrology-dark px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity self-start sm:self-auto"
        >
          <Plus size={20} /> Add New Entry
        </button>
      </header>
      
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button 
          onClick={() => setSelectedFilterCategory('all')}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${selectedFilterCategory === 'all' ? 'bg-astrology-gold text-astrology-dark' : 'bg-astrology-card border border-astrology-gold/20 text-gray-300 hover:border-astrology-gold/50'}`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button 
            key={cat.value}
            onClick={() => setSelectedFilterCategory(cat.value)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${selectedFilterCategory === cat.value ? 'bg-astrology-gold text-astrology-dark' : 'bg-astrology-card border border-astrology-gold/20 text-gray-300 hover:border-astrology-gold/50'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Modal / Form overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50 overflow-y-auto">
          <div className="bg-astrology-card border border-astrology-gold/30 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-astrology-gold/20 pb-4">
              <h3 className="text-xl font-bold text-astrology-gold font-['Outfit']">
                {editingId ? 'Edit Sakunam Entry' : 'Create New Sakunam Entry'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-astrology-gold mb-1">Category *</label>
                <select
                  value={sakunamForm.category}
                  onChange={e => setSakunamForm({ ...sakunamForm, category: e.target.value })}
                  className="w-full bg-astrology-dark/60 border border-astrology-gold/20 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-astrology-gold mb-1">Title (Tamil) *</label>
                  <input
                    type="text"
                    required
                    placeholder="எ.கா: கிழக்கு திசை"
                    value={sakunamForm.titleTa}
                    onChange={e => setSakunamForm({ ...sakunamForm, titleTa: e.target.value })}
                    className="w-full bg-astrology-dark/60 border border-astrology-gold/20 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-astrology-gold mb-1">Title (English)</label>
                  <input
                    type="text"
                    placeholder="e.g. East Direction"
                    value={sakunamForm.titleEn}
                    onChange={e => setSakunamForm({ ...sakunamForm, titleEn: e.target.value })}
                    className="w-full bg-astrology-dark/60 border border-astrology-gold/20 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
              </div>

              <div className="text-black">
                <label className="block text-sm font-medium text-astrology-gold mb-1">Content (Tamil) *</label>
                <ReactQuill 
                  theme="snow"
                  value={sakunamForm.contentTa}
                  onChange={(content) => setSakunamForm({ ...sakunamForm, contentTa: content })}
                  className="bg-white rounded-lg"
                />
              </div>

              <div className="text-black">
                <label className="block text-sm font-medium text-astrology-gold mb-1">Content (English)</label>
                <ReactQuill 
                  theme="snow"
                  value={sakunamForm.contentEn}
                  onChange={(content) => setSakunamForm({ ...sakunamForm, contentEn: content })}
                  className="bg-white rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-astrology-gold mb-1">Image (Optional)</label>
                <ImageUploader
                  value={sakunamForm.imageUrl}
                  onChange={(url) => setSakunamForm({ ...sakunamForm, imageUrl: url })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-astrology-gold/20">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gold-gradient text-astrology-dark px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Entry' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading Sakunam entries...</div>
      ) : filteredSakunamList.length === 0 ? (
        <div className="bg-astrology-card/50 border border-astrology-gold/20 rounded-xl p-12 text-center text-gray-400">
          <Eye className="w-12 h-12 mx-auto text-astrology-gold/50 mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">No entries found for this category</h3>
          <p className="text-sm">Click "Add New Entry" above to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSakunamList.map(sakunam => (
            <div 
              key={sakunam.id} 
              className="bg-astrology-card border border-astrology-gold/20 rounded-xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-astrology-gold/40 transition-colors"
            >
              <div>
                {sakunam.imageUrl ? (
                  <img 
                    src={sakunam.imageUrl} 
                    alt={sakunam.titleTa || sakunam.titleEn} 
                    className="w-full h-44 object-cover"
                  />
                ) : (
                  <div className="w-full h-44 bg-astrology-dark/80 flex items-center justify-center text-astrology-gold/30">
                    <ImageIcon size={48} />
                  </div>
                )}

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-astrology-gold font-medium">
                    <span className="bg-astrology-gold/20 px-2 py-1 rounded text-astrology-gold">{CATEGORIES.find(c => c.value === sakunam.category)?.label || sakunam.category}</span>
                    <span className="text-gray-400">
                      {new Date(sakunam.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white line-clamp-2">
                    {sakunam.titleTa}
                  </h3>
                  {sakunam.titleEn && (
                    <p className="text-xs text-gray-400 font-sans italic line-clamp-1">
                      {sakunam.titleEn}
                    </p>
                  )}

                  <p className="text-sm text-gray-300 line-clamp-3">
                    <span dangerouslySetInnerHTML={{ __html: sakunam.contentTa.substring(0, 100) }} />
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-astrology-gold/10 flex items-center justify-end bg-astrology-dark/30 text-xs">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(sakunam)}
                    className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(sakunam.id, sakunam.titleTa || sakunam.titleEn || '')}
                    className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Sakunam
