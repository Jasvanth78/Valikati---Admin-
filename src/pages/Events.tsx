import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Calendar, Clock, MapPin, Send, Image as ImageIcon, X, Sparkles, AlertTriangle } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'
import { ImageUploader } from '../components/ImageUploader'

interface EventForm {
  id?: string
  titleTa: string
  titleEn: string
  date: string
  time: string
  locationTa: string
  locationEn: string
  descriptionTa: string
  descriptionEn: string
  imageUrl: string
  sendNotification: boolean
}

const emptyEventForm: EventForm = {
  titleTa: '',
  titleEn: '',
  date: new Date().toISOString().split('T')[0],
  time: '',
  locationTa: '',
  locationEn: '',
  descriptionTa: '',
  descriptionEn: '',
  imageUrl: '',
  sendNotification: true
}

const Events = () => {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [eventForm, setEventForm] = useState<EventForm>(emptyEventForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/events`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventForm.titleTa && !eventForm.titleEn) {
      alert('Please provide an event title.')
      return
    }

    setSaving(true)
    const isEdit = !!editingId
    const url = isEdit 
      ? `${API_BASE_URL}/api/admin/events/${editingId}`
      : `${API_BASE_URL}/api/admin/events`
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        },
        body: JSON.stringify(eventForm)
      })
      if (response.ok) {
        setIsFormOpen(false)
        setEditingId(null)
        setEventForm(emptyEventForm)
        fetchEvents()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error || 'Failed to save event'}`)
      }
    } catch (error: any) {
      console.error('Error saving event:', error)
      alert(`Error saving event: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (ev: any) => {
    const formattedDate = ev.date ? new Date(ev.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    setEventForm({
      id: ev.id,
      titleTa: ev.titleTa || '',
      titleEn: ev.titleEn || '',
      date: formattedDate,
      time: ev.time || '',
      locationTa: ev.locationTa || '',
      locationEn: ev.locationEn || '',
      descriptionTa: ev.descriptionTa || '',
      descriptionEn: ev.descriptionEn || '',
      imageUrl: ev.imageUrl || '',
      sendNotification: false
    })
    setEditingId(ev.id)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete event: "${title}"?`)) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
      if (response.ok) {
        fetchEvents()
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }


  const handleDeleteAll = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/events/all`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') }
      })
      if (response.ok) {
        setIsDeleteAllModalOpen(false)
        fetchEvents()
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
            <Sparkles className="w-8 h-8 text-astrology-gold" />
            Upcoming Events
          </h2>
          <p className="text-gray-400">Post and manage upcoming temple festivals, special poojas, and spiritual events.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null)
            setEventForm(emptyEventForm)
            setIsFormOpen(true)
          }}
          className="flex items-center gap-2 bg-gold-gradient text-astrology-dark px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity self-start sm:self-auto"
        >
          <Plus size={20} /> Add Upcoming Event
        </button>
      </header>

      {/* Modal / Form overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50 overflow-y-auto">
          <div className="bg-astrology-card border border-astrology-gold/30 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-astrology-gold/20 pb-4">
              <h3 className="text-xl font-bold text-astrology-gold font-['Outfit']">
                {editingId ? 'Edit Event' : 'Add Upcoming Event'}
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
                  <label className="block text-sm font-medium text-astrology-gold mb-1">Event Title (Tamil) *</label>
                  <input
                    type="text"
                    required
                    placeholder="எ.கா: மகா சிவராத்திரி வழிபாடு"
                    value={eventForm.titleTa}
                    onChange={e => setEventForm({ ...eventForm, titleTa: e.target.value })}
                    className="w-full bg-astrology-dark/60 border border-astrology-gold/20 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-astrology-gold mb-1">Event Title (English)</label>
                  <input
                    type="text"
                    placeholder="e.g. Maha Shivaratri Festival"
                    value={eventForm.titleEn}
                    onChange={e => setEventForm({ ...eventForm, titleEn: e.target.value })}
                    className="w-full bg-astrology-dark/60 border border-astrology-gold/20 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-astrology-gold mb-1">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full bg-astrology-dark/60 border border-astrology-gold/20 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-astrology-gold mb-1">Event Time</label>
                  <input
                    type="text"
                    placeholder="எ.கா: காலை 06:00 - 12:00 PM"
                    value={eventForm.time}
                    onChange={e => setEventForm({ ...eventForm, time: e.target.value })}
                    className="w-full bg-astrology-dark/60 border border-astrology-gold/20 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-astrology-gold mb-1">Location / Venue (Tamil)</label>
                  <input
                    type="text"
                    placeholder="எ.கா: அருள்மிகு மீனாட்சி அம்மன் கோவில்"
                    value={eventForm.locationTa}
                    onChange={e => setEventForm({ ...eventForm, locationTa: e.target.value })}
                    className="w-full bg-astrology-dark/60 border border-astrology-gold/20 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-astrology-gold mb-1">Location / Venue (English)</label>
                  <input
                    type="text"
                    placeholder="e.g. Meenakshi Amman Temple"
                    value={eventForm.locationEn}
                    onChange={e => setEventForm({ ...eventForm, locationEn: e.target.value })}
                    className="w-full bg-astrology-dark/60 border border-astrology-gold/20 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-astrology-gold mb-1">Description (Tamil)</label>
                <textarea
                  rows={3}
                  placeholder="நிகழ்வின் சிறப்புகள் மற்றும் வழிபாட்டு முறைகள்..."
                  value={eventForm.descriptionTa}
                  onChange={e => setEventForm({ ...eventForm, descriptionTa: e.target.value })}
                  className="w-full bg-astrology-dark/60 border border-astrology-gold/20 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-astrology-gold mb-1">Description (English)</label>
                <textarea
                  rows={2}
                  placeholder="Event details & significance in English..."
                  value={eventForm.descriptionEn}
                  onChange={e => setEventForm({ ...eventForm, descriptionEn: e.target.value })}
                  className="w-full bg-astrology-dark/60 border border-astrology-gold/20 rounded-lg p-2.5 text-white focus:border-astrology-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-astrology-gold mb-1">Event Banner Image</label>
                <ImageUploader
                  value={eventForm.imageUrl}
                  onChange={(url) => setEventForm({ ...eventForm, imageUrl: url })}
                />
              </div>

              {!editingId && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="sendEventNotification"
                    checked={eventForm.sendNotification}
                    onChange={e => setEventForm({ ...eventForm, sendNotification: e.target.checked })}
                    className="w-4 h-4 accent-astrology-gold rounded cursor-pointer"
                  />
                  <label htmlFor="sendEventNotification" className="text-sm text-gray-300 cursor-pointer flex items-center gap-1.5">
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
                  {saving ? 'Saving...' : editingId ? 'Update Event' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading upcoming events...</div>
      ) : events.length === 0 ? (
        <div className="bg-astrology-card/50 border border-astrology-gold/20 rounded-xl p-12 text-center text-gray-400">
          <Calendar className="w-12 h-12 mx-auto text-astrology-gold/50 mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">No upcoming events listed</h3>
          <p className="text-sm">Click "Add Upcoming Event" above to list special events and poojas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(ev => (
            <div 
              key={ev.id} 
              className="bg-astrology-card border border-astrology-gold/20 rounded-xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-astrology-gold/40 transition-colors"
            >
              <div>
                {ev.imageUrl ? (
                  <img 
                    src={ev.imageUrl} 
                    alt={ev.titleTa || ev.titleEn} 
                    className="w-full h-44 object-cover"
                  />
                ) : (
                  <div className="w-full h-44 bg-astrology-dark/80 flex items-center justify-center text-astrology-gold/30">
                    <ImageIcon size={48} />
                  </div>
                )}

                <div className="p-5 space-y-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="flex items-center gap-1 bg-pink-500/10 text-pink-400 px-2.5 py-1 rounded-full border border-pink-500/20 font-medium">
                      <Calendar size={12} /> {new Date(ev.date).toLocaleDateString()}
                    </span>
                    {ev.time && (
                      <span className="flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20 font-medium">
                        <Clock size={12} /> {ev.time}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white line-clamp-2">
                    {ev.titleTa}
                  </h3>
                  {ev.titleEn && (
                    <p className="text-xs text-gray-400 font-sans italic line-clamp-1">
                      {ev.titleEn}
                    </p>
                  )}

                  {ev.locationTa && (
                    <p className="text-xs text-astrology-gold flex items-center gap-1">
                      <MapPin size={14} className="shrink-0" /> {ev.locationTa}
                    </p>
                  )}

                  {ev.descriptionTa && (
                    <p className="text-sm text-gray-300 line-clamp-3">
                      {ev.descriptionTa}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-astrology-gold/10 flex items-center justify-end gap-2 bg-astrology-dark/30">
                <button 
                  onClick={() => handleEdit(ev)}
                  className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                  title="Edit Event"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(ev.id, ev.titleTa || ev.titleEn || '')}
                  className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                  title="Delete Event"
                >
                  <Trash2 size={16} />
                </button>
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

export default Events
