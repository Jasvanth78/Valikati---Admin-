import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, BookOpen, Send, User, Tag, Image as ImageIcon, X } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'
import { ImageUploader } from '../components/ImageUploader'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

interface BlogForm {
  id?: string
  titleTa: string
  titleEn: string
  categoryTa: string
  categoryEn: string
  contentTa: string
  contentEn: string
  author: string
  imageUrl: string
  audioUrl?: string
  sendNotification: boolean
}

const emptyBlogForm: BlogForm = {
  titleTa: '',
  titleEn: '',
  categoryTa: 'பொது',
  categoryEn: 'General',
  contentTa: '',
  contentEn: '',
  author: 'Valikatti Team',
  imageUrl: '',
  audioUrl: '',
  sendNotification: true
}

const Blogs = () => {
  const [blogs, setBlogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [blogForm, setBlogForm] = useState<BlogForm>(emptyBlogForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/blogs`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
      if (response.ok) {
        const data = await response.json()
        setBlogs(data)
      }
    } catch (error) {
      console.error('Error fetching blogs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!blogForm.titleTa && !blogForm.titleEn) {
      alert('Please provide at least one title.')
      return
    }
    if (!blogForm.contentTa && !blogForm.contentEn) {
      alert('Please provide blog content.')
      return
    }

    setSaving(true)
    const isEdit = !!editingId
    const url = isEdit 
      ? `${API_BASE_URL}/api/admin/blogs/${editingId}`
      : `${API_BASE_URL}/api/admin/blogs`
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        },
        body: JSON.stringify(blogForm)
      })
      if (response.ok) {
        setIsFormOpen(false)
        setEditingId(null)
        setBlogForm(emptyBlogForm)
        fetchBlogs()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error || 'Failed to save blog'}`)
      }
    } catch (error: any) {
      console.error('Error saving blog:', error)
      alert(`Error saving blog: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (blog: any) => {
    setBlogForm({
      id: blog.id,
      titleTa: blog.titleTa || '',
      titleEn: blog.titleEn || '',
      categoryTa: blog.categoryTa || 'பொது',
      categoryEn: blog.categoryEn || 'General',
      contentTa: blog.contentTa || '',
      contentEn: blog.contentEn || '',
      author: blog.author || 'Valikatti Team',
      imageUrl: blog.imageUrl || '',
      audioUrl: blog.audioUrl || '',
      sendNotification: false
    })
    setEditingId(blog.id)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete blog: "${title}"?`)) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/blogs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
      if (response.ok) {
        fetchBlogs()
      }
    } catch (error) {
      console.error('Error deleting blog:', error)
    }
  }


  const handleDeleteAll = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/blogs/all`, {
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
    <div className="font-['Inter'] space-y-6">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 font-['Outfit']">
        <div>
          <h2 className="text-3xl font-bold text-astrology-gold flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-astrology-gold" />
            Blog Management
          </h2>
          <p className="text-gray-400">Publish spiritual articles, news, and posts to mobile users.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null)
            setBlogForm(emptyBlogForm)
            setIsFormOpen(true)
          }}
          className="flex items-center gap-2 bg-gold-gradient text-astrology-dark px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity self-start sm:self-auto"
        >
          <Plus size={20} /> Post New Blog
        </button>
      </header>

      {/* Modal / Form overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50 overflow-y-auto">
          <div className="bg-astrology-card border border-astrology-gold/30 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-astrology-gold/20 pb-4">
              <h3 className="text-xl font-bold text-astrology-gold font-['Outfit']">
                {editingId ? 'Edit Blog Post' : 'Create New Blog Post'}
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
                    placeholder="எ.கா: ஆன்மீக வழிகாட்டி"
                    value={blogForm.titleTa}
                    onChange={e => setBlogForm({ ...blogForm, titleTa: e.target.value })}
                    className="w-full bg-astrology-dark/60 border border-astrology-gold/20 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-astrology-gold mb-1">Title (English)</label>
                  <input
                    type="text"
                    placeholder="e.g. Spiritual Guide"
                    value={blogForm.titleEn}
                    onChange={e => setBlogForm({ ...blogForm, titleEn: e.target.value })}
                    className="w-full bg-astrology-dark/60 border border-astrology-gold/20 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-astrology-gold mb-1">Category (Tamil)</label>
                  <input
                    type="text"
                    placeholder="பொது / ஜோதிடம் / ஆன்மீகம்"
                    value={blogForm.categoryTa}
                    onChange={e => setBlogForm({ ...blogForm, categoryTa: e.target.value })}
                    className="w-full bg-astrology-dark/60 border border-astrology-gold/20 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-astrology-gold mb-1">Category (English)</label>
                  <input
                    type="text"
                    placeholder="General / Astrology / Spiritual"
                    value={blogForm.categoryEn}
                    onChange={e => setBlogForm({ ...blogForm, categoryEn: e.target.value })}
                    className="w-full bg-astrology-dark/60 border border-astrology-gold/20 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-astrology-gold mb-1">Author</label>
                  <input
                    type="text"
                    value={blogForm.author}
                    onChange={e => setBlogForm({ ...blogForm, author: e.target.value })}
                    className="w-full bg-astrology-dark/60 border border-astrology-gold/20 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
              </div>

              <div className="text-black">
                <label className="block text-sm font-medium text-astrology-gold mb-1">Content (Tamil) *</label>
                <ReactQuill 
                  theme="snow"
                  value={blogForm.contentTa}
                  onChange={(content) => setBlogForm({ ...blogForm, contentTa: content })}
                  className="bg-white rounded-lg"
                />
              </div>

              <div className="text-black">
                <label className="block text-sm font-medium text-astrology-gold mb-1">Content (English)</label>
                <ReactQuill 
                  theme="snow"
                  value={blogForm.contentEn}
                  onChange={(content) => setBlogForm({ ...blogForm, contentEn: content })}
                  className="bg-white rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-astrology-gold mb-1">Header Image</label>
                <ImageUploader
                  value={blogForm.imageUrl}
                  onChange={(url) => setBlogForm({ ...blogForm, imageUrl: url })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-astrology-gold mb-1">Audio URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://example.com/audio.mp3"
                  value={blogForm.audioUrl || ''}
                  onChange={e => setBlogForm({ ...blogForm, audioUrl: e.target.value })}
                  className="w-full bg-astrology-dark/60 border border-astrology-gold/20 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                />
              </div>

              {!editingId && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="sendNotification"
                    checked={blogForm.sendNotification}
                    onChange={e => setBlogForm({ ...blogForm, sendNotification: e.target.checked })}
                    className="w-4 h-4 accent-astrology-gold rounded cursor-pointer"
                  />
                  <label htmlFor="sendNotification" className="text-sm text-gray-300 cursor-pointer flex items-center gap-1.5">
                    <Send size={16} className="text-astrology-gold" /> Broadcast push notification to all mobile users
                  </label>
                </div>
              )}

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
                  {saving ? 'Publishing...' : editingId ? 'Update Blog' : 'Publish Blog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blogs List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading blog posts...</div>
      ) : blogs.length === 0 ? (
        <div className="bg-astrology-card/50 border border-astrology-gold/20 rounded-xl p-12 text-center text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto text-astrology-gold/50 mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">No blogs published yet</h3>
          <p className="text-sm">Click "Post New Blog" above to write and publish your first blog post.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map(blog => (
            <div 
              key={blog.id} 
              className="bg-astrology-card border border-astrology-gold/20 rounded-xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-astrology-gold/40 transition-colors"
            >
              <div>
                {blog.imageUrl ? (
                  <img 
                    src={blog.imageUrl} 
                    alt={blog.titleTa || blog.titleEn} 
                    className="w-full h-44 object-cover"
                  />
                ) : (
                  <div className="w-full h-44 bg-astrology-dark/80 flex items-center justify-center text-astrology-gold/30">
                    <ImageIcon size={48} />
                  </div>
                )}

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-astrology-gold font-medium">
                    <span className="flex items-center gap-1 bg-astrology-gold/10 px-2.5 py-1 rounded-full border border-astrology-gold/20">
                      <Tag size={12} /> {blog.categoryTa || blog.categoryEn || 'General'}
                    </span>
                    <span className="text-gray-400">
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white line-clamp-2">
                    {blog.titleTa}
                  </h3>
                  {blog.titleEn && (
                    <p className="text-xs text-gray-400 font-sans italic line-clamp-1">
                      {blog.titleEn}
                    </p>
                  )}

                  <p className="text-sm text-gray-300 line-clamp-3">
                    {blog.contentTa}
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-astrology-gold/10 flex items-center justify-between bg-astrology-dark/30 text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <User size={14} className="text-astrology-gold" /> {blog.author || 'Valikatti'}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(blog)}
                    className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                    title="Edit Blog"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(blog.id, blog.titleTa || blog.titleEn || '')}
                    className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                    title="Delete Blog"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
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

export default Blogs
