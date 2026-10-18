import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit } from 'lucide-react'
import { fetchApi } from '../utils/api'
import { ImageUploader } from '../components/ImageUploader'

export default function Proverbs() {
  const [proverbs, setProverbs] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ contentTa: '', contentEn: '', meaningTa: '', meaningEn: '' })
  const [editingId, setEditingId] = useState(null)
  const [background, setBackground] = useState('')
  const [backgroundLoaded, setBackgroundLoaded] = useState(false)
  const [backgroundBusy, setBackgroundBusy] = useState(false)
  const [uploadingBackground, setUploadingBackground] = useState(false)

  useEffect(() => {
    fetchProverbs()
    loadBackground()
  }, [])

  const loadBackground = async () => {
    try {
      const data = await fetchApi('/api/admin/app-content')
      if (!Array.isArray(data)) throw new Error('Invalid settings response')
      const saved = data.find((item: any) => item.key === 'home_proverb_background')
      setBackground(saved?.en || '')
      setBackgroundLoaded(true)
    } catch { setMessage('Could not load the proverb background. Retry before publishing.') }
  }

  const publishBackground = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!backgroundLoaded || uploadingBackground || backgroundBusy) return
    setBackgroundBusy(true)
    try {
      await fetchApi('/api/admin/app-content', {
        method: 'PUT',
        body: JSON.stringify({ key: 'home_proverb_background', ta: background.trim(), en: background.trim() }),
      })
      setMessage(background.trim() ? 'Proverb background published to the app.' : 'Default proverb background restored.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not publish the background.') }
    finally { setBackgroundBusy(false) }
  }

  const fetchProverbs = async () => {
    try {
      const data = await fetchApi('/api/proverbs')
      if (!Array.isArray(data)) throw new Error('Invalid backend response')
      setProverbs(data)
      setLoading(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed. Please retry.')
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId 
        ? `/api/proverbs/${editingId}`
        : '/api/proverbs'
      const method = editingId ? 'PUT' : 'POST'

      await fetchApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      setMessage('Proverb saved and published.')
      {
        setFormData({ contentTa: '', contentEn: '', meaningTa: '', meaningEn: '' })
        setEditingId(null)
        fetchProverbs()
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed. Please retry.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      await fetchApi(`/api/proverbs/${id}`, { method: 'DELETE' })
      fetchProverbs()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed. Please retry.')
    }
  }

  const editProverb = (p: any) => {
    setEditingId(p.id)
    setFormData({ contentTa: p.contentTa, contentEn: p.contentEn || '', meaningTa: p.meaningTa || '', meaningEn: p.meaningEn || '' })
  }

  return (
    <div className="space-y-6">
      {message && <p role="status" className="text-astrology-gold">{message}</p>}
      <h2 className="text-2xl font-bold bg-gold-gradient bg-clip-text text-transparent">Proverbs (பழமொழி)</h2>
      
      <form onSubmit={publishBackground} className="bg-astrology-card p-6 rounded-xl border border-astrology-gold/20 space-y-4">
        <h3 className="text-xl font-bold">Home proverb card background</h3>
        <p className="text-sm text-gray-400">Choose an image from your device for the Today's Proverb card. A wide landscape image works best. Remove the image and publish to restore the default background.</p>
        {!backgroundLoaded ? <button type="button" onClick={loadBackground}>Load / retry background settings</button> : <fieldset disabled={backgroundBusy} className="space-y-4">
          <ImageUploader label="Proverb background image" value={background} onChange={setBackground} folder="home_backgrounds" rasterOnly onBusy={setUploadingBackground} />
          <button type="submit" disabled={uploadingBackground} className="bg-gold-gradient text-astrology-dark font-bold px-6 py-2 rounded">{backgroundBusy ? 'Publishing…' : 'Publish proverb background'}</button>
        </fieldset>}
      </form>

      <div className="bg-astrology-card p-6 rounded-xl border border-astrology-gold/20">
        <h3 className="text-xl font-bold mb-4">{editingId ? 'Edit Proverb' : 'Add New Proverb'}</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <textarea required placeholder="Proverb (Tamil)" value={formData.contentTa} onChange={e => setFormData({...formData, contentTa: e.target.value})} className="bg-black/50 border border-astrology-gold/20 rounded p-2 text-white h-24" />
          <textarea placeholder="Proverb (English)" value={formData.contentEn} onChange={e => setFormData({...formData, contentEn: e.target.value})} className="bg-black/50 border border-astrology-gold/20 rounded p-2 text-white h-24" />
          <textarea placeholder="Meaning (Tamil)" value={formData.meaningTa} onChange={e => setFormData({...formData, meaningTa: e.target.value})} className="bg-black/50 border border-astrology-gold/20 rounded p-2 text-white h-24" />
          <textarea placeholder="Meaning (English)" value={formData.meaningEn} onChange={e => setFormData({...formData, meaningEn: e.target.value})} className="bg-black/50 border border-astrology-gold/20 rounded p-2 text-white h-24" />
          <div className="md:col-span-2">
            <button type="submit" className="bg-gold-gradient text-astrology-dark font-bold px-6 py-2 rounded">
              {editingId ? 'Update' : 'Add'} Proverb
            </button>
            {editingId && (
              <button type="button" onClick={() => {setEditingId(null); setFormData({ contentTa: '', contentEn: '', meaningTa: '', meaningEn: '' })}} className="ml-4 text-gray-400 hover:text-white">Cancel</button>
            )}
          </div>
        </form>
      </div>

      {!loading && proverbs.length === 0 && <p>No proverbs saved yet. Add one above to display it in the app.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? <p>Loading...</p> : proverbs.map((p: any) => (
          <div key={p.id} className="bg-astrology-card p-4 rounded-xl border border-astrology-gold/20 relative">
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => editProverb(p)} className="text-blue-400 hover:text-blue-300"><Edit size={18}/></button>
              <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300"><Trash2 size={18}/></button>
            </div>
            <p className="font-bold text-lg mb-2 pr-16">{p.contentTa}</p>
            {p.contentEn && <p className="text-gray-400 mb-2 italic">{p.contentEn}</p>}
            {p.meaningTa && <p className="text-sm mt-2"><span className="text-astrology-gold">Tamil Meaning:</span> {p.meaningTa}</p>}
            {p.meaningEn && <p className="text-sm mt-1"><span className="text-astrology-gold">English Meaning:</span> {p.meaningEn}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
