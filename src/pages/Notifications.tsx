import React, { useState } from 'react'
import { Send, Users, Bell, MessageSquare, History } from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL } from '../utils/api'

const Notifications = () => {
  const [target, setTarget] = useState('all')
  const [rasi, setRasi] = useState('Mesham')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
 
  const handleSend = async () => {
    if (!title || !message) return alert('Please enter title and message');
    
    setSending(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/send-notification`, {
        title,
        body: message,
        target,
        rasi: target === 'rasi' ? rasi : null
      });
      alert(response.data.message || 'Notification sent!');
      setTitle('');
      setMessage('');
    } catch (error: any) {
      alert('Failed to send notification: ' + (error.response?.data?.error || error.message));
    } finally {
      setSending(false);
    }
  };

  const pastNotifications = [
    { id: 1, title: 'Daily Rasi Palan', target: 'All Users', date: '2026-03-19 08:00 AM' },
    { id: 2, title: 'Festival Alert: Holi', target: 'All Users', date: '2026-03-18 10:00 AM' },
    { id: 3, title: 'Special Message', target: 'Mesham', date: '2026-03-17 06:00 PM' },
  ]

  return (
    <div className="font-['Inter']">
      <header className="flex justify-between items-center mb-8 font-['Outfit']">
        <div>
          <h2 className="text-3xl font-bold text-astrology-gold">Notification Center</h2>
          <p className="text-gray-400 font-['Inter']">Send push notifications to your users via Firebase.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Send Form */}
        <div className="lg:col-span-2 bg-astrology-card p-8 rounded-xl border border-astrology-gold/10 shadow-2xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-astrology-gold font-['Outfit']">
            <Send size={20} />
            Compose Notification
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-500 mb-2">Target Audience</label>
              <div className="flex gap-4">
                {['all', 'rasi', 'individual'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setTarget(opt)}
                    className={`px-4 py-2 rounded-lg border capitalize transition-all ${target === opt ? 'bg-astrology-gold/20 border-astrology-gold text-astrology-gold' : 'border-white/10 text-gray-500 hover:border-white/20'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {target === 'rasi' && (
              <div>
                <label className="block text-sm text-gray-500 mb-2">Select Rasi</label>
                <select 
                  value={rasi}
                  onChange={(e) => setRasi(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 outline-none focus:border-astrology-gold text-white"
                >
                  {[
                    'Mesham', 'Rishabam', 'Midhunam', 'Kadagam', 
                    'Simmam', 'Kanni', 'Thulaam', 'Viruchigam', 
                    'Dhanusu', 'Magaram', 'Kumbam', 'Meenam'
                  ].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-500 mb-2">Notification Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Daily Rasi Palan is here!"
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 outline-none focus:border-astrology-gold text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-2">Message Body</label>
              <textarea 
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message..."
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 outline-none focus:border-astrology-gold text-white resize-none"
              ></textarea>
            </div>

            <button 
              onClick={handleSend}
              disabled={sending}
              className="w-full btn-gold py-4 flex items-center justify-center gap-2 text-lg shadow-[0_0_20px_rgba(212,175,55,0.2)] disabled:opacity-50"
            >
              <Send size={20} />
              {sending ? 'Sending...' : 'Send Notification Now'}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="bg-astrology-card p-6 rounded-xl border border-astrology-gold/10">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-astrology-gold font-['Outfit']">
            <History size={18} />
            Recent Broadcasts
          </h3>
          <div className="space-y-4">
            {pastNotifications.map(notif => (
              <div key={notif.id} className="p-4 rounded-lg bg-black/40 border border-white/5 hover:bg-black/60 transition-colors">
                <div className="text-sm font-bold mb-1">{notif.title}</div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>To: {notif.target}</span>
                  <span>{notif.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications
