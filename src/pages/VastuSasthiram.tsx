import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Home, Image as ImageIcon, X, AlertTriangle } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'
import { ImageUploader } from '../components/ImageUploader'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

interface VastuForm {
  id?: string
  titleTa: string
  titleEn: string
  contentTa: string
  contentEn: string
  imageUrl: string
}

const emptyVastuForm: VastuForm = {
  titleTa: '',
  titleEn: '',
  contentTa: '',
  contentEn: '',
  imageUrl: '',
}

const VastuSasthiram = () => {
  const [vastuList, setVastuList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [vastuForm, setVastuForm] = useState<VastuForm>(emptyVastuForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchVastuList()
  }, [])

  const fetchVastuList = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/vastu`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
      if (response.ok) {
        const data = await response.json()
        setVastuList(data)
      }
    } catch (error) {
      console.error('Error fetching Vastu:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vastuForm.titleTa && !vastuForm.titleEn) {
      alert('Please provide at least one title.')
      return
    }
    if (!vastuForm.contentTa && !vastuForm.contentEn) {
      alert('Please provide content.')
      return
    }

    setSaving(true)
    const isEdit = !!editingId
    const url = isEdit 
      ? `${API_BASE_URL}/api/admin/vastu/${editingId}`
      : `${API_BASE_URL}/api/admin/vastu`
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        },
        body: JSON.stringify(vastuForm)
      })
      if (response.ok) {
        setIsFormOpen(false)
        setEditingId(null)
        setVastuForm(emptyVastuForm)
        fetchVastuList()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error || 'Failed to save Vastu article'}`)
      }
    } catch (error: any) {
      console.error('Error saving Vastu:', error)
      alert(`Error saving Vastu: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (vastu: any) => {
    setVastuForm({
      id: vastu.id,
      titleTa: vastu.titleTa || '',
      titleEn: vastu.titleEn || '',
      contentTa: vastu.contentTa || '',
      contentEn: vastu.contentEn || '',
      imageUrl: vastu.imageUrl || '',
    })
    setEditingId(vastu.id)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete Vastu article: "${title}"?`)) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/vastu/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
      if (response.ok) {
        fetchVastuList()
      }
    } catch (error) {
      console.error('Error deleting Vastu:', error)
    }
  }

  const handleDeleteAll = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/vastu/all`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') }
      })
      if (response.ok) {
        setIsDeleteAllModalOpen(false)
        fetchVastuList()
      } else {
        alert('Failed to delete all data')
      }
    } catch (error) {
      console.error('Error deleting all data:', error)
    }
  }

  return (
    <div className="font-['Inter'] space-y-6">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 font-['Outfit']">
        <div>
          <h2 className="text-3xl font-bold text-astrology-gold flex items-center gap-2">
            <Home className="w-8 h-8 text-astrology-gold" />
            Vastu Sasthiram Management
          </h2>
          <p className="text-gray-400">Publish Vastu rules and diagrams to the mobile app.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null)
            setVastuForm(emptyVastuForm)
            setIsFormOpen(true)
          }}
          className="flex items-center gap-2 bg-gold-gradient text-astrology-dark px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity self-start sm:self-auto"
        >
          <Plus size={20} /> Add New Vastu Article
        </button>
      </header>

      {/* Modal / Form overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50 overflow-y-auto">
          <div className="bg-astrology-card border border-astrology-gold/30 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-astrology-gold/20 pb-4">
              <h3 className="text-xl font-bold text-astrology-gold font-['Outfit']">
                {editingId ? 'Edit Vastu Article' : 'Create New Vastu Article'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-astrology-gold mb-1">Title (Tamil) *</label>
                  <input
                    type="text"
                    required
                    placeholder="எ.கா: வாஸ்து விதிகள்"
                    value={vastuForm.titleTa}
                    onChange={e => setVastuForm({ ...vastuForm, titleTa: e.target.value })}
                    className="w-full bg-astrology-dark/60 border border-astrology-gold/20 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-astrology-gold mb-1">Title (English)</label>
                  <input
                    type="text"
                    placeholder="e.g. Vastu Rules"
                    value={vastuForm.titleEn}
                    onChange={e => setVastuForm({ ...vastuForm, titleEn: e.target.value })}
                    className="w-full bg-astrology-dark/60 border border-astrology-gold/20 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
              </div>

              <div className="text-black">
                <label className="block text-sm font-medium text-astrology-gold mb-1">Content (Tamil) *</label>
                <ReactQuill 
                  theme="snow"
                  value={vastuForm.contentTa}
                  onChange={(content) => setVastuForm({ ...vastuForm, contentTa: content })}
                  className="bg-white rounded-lg"
                />
              </div>

              <div className="text-black">
                <label className="block text-sm font-medium text-astrology-gold mb-1">Content (English)</label>
                <ReactQuill 
                  theme="snow"
                  value={vastuForm.contentEn}
                  onChange={(content) => setVastuForm({ ...vastuForm, contentEn: content })}
                  className="bg-white rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-astrology-gold mb-1">Diagram/Image</label>
                <ImageUploader
                  value={vastuForm.imageUrl}
                  onChange={(url) => setVastuForm({ ...vastuForm, imageUrl: url })}
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
                  {saving ? 'Publishing...' : editingId ? 'Update Article' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading Vastu articles...</div>
      ) : vastuList.length === 0 ? (
        <div className="bg-astrology-card/50 border border-astrology-gold/20 rounded-xl p-12 text-center text-gray-400">
          <Home className="w-12 h-12 mx-auto text-astrology-gold/50 mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">No Vastu articles published yet</h3>
          <p className="text-sm">Click "Add New Vastu Article" above to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vastuList.map(vastu => (
            <div 
              key={vastu.id} 
              className="bg-astrology-card border border-astrology-gold/20 rounded-xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-astrology-gold/40 transition-colors"
            >
              <div>
                {vastu.imageUrl ? (
                  <img 
                    src={vastu.imageUrl} 
                    alt={vastu.titleTa || vastu.titleEn} 
                    className="w-full h-44 object-cover"
                  />
                ) : (
                  <div className="w-full h-44 bg-astrology-dark/80 flex items-center justify-center text-astrology-gold/30">
                    <ImageIcon size={48} />
                  </div>
                )}

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-astrology-gold font-medium">
                    <span className="text-gray-400">
                      {new Date(vastu.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white line-clamp-2">
                    {vastu.titleTa}
                  </h3>
                  {vastu.titleEn && (
                    <p className="text-xs text-gray-400 font-sans italic line-clamp-1">
                      {vastu.titleEn}
                    </p>
                  )}

                  <p className="text-sm text-gray-300 line-clamp-3">
                    <span dangerouslySetInnerHTML={{ __html: vastu.contentTa.substring(0, 100) }} />
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-astrology-gold/10 flex items-center justify-end bg-astrology-dark/30 text-xs">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(vastu)}
                    className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(vastu.id, vastu.titleTa || vastu.titleEn || '')}
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

export default VastuSasthiram
