import React, { useState, useEffect } from 'react'
import { Search, UserMinus, Mail, Calendar } from 'lucide-react'
import { API_BASE_URL } from '../utils/api'

const Users = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          // Normally we'd include the token here
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="font-['Inter']">
      <header className="flex justify-between items-center mb-8 font-['Outfit']">
        <div>
          <h2 className="text-3xl font-bold text-astrology-gold">User Management</h2>
          <p className="text-gray-400 font-['Inter']">View and manage registered users of the Valikatti app.</p>
        </div>
      </header>

      {/* Search & Active Stats */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search users by name, email or rasi..." 
            className="w-full bg-astrology-card border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:border-astrology-gold outline-none transition-all shadow-xl"
          />
        </div>
        <div className="flex gap-4">
          <div className="bg-astrology-card border border-white/5 px-6 py-3 rounded-lg">
            <span className="text-gray-500 text-xs block uppercase">Online Now</span>
            <span className="text-xl font-bold text-green-400">42</span>
          </div>
          <div className="bg-astrology-card border border-white/5 px-6 py-3 rounded-lg">
            <span className="text-gray-500 text-xs block uppercase">FCM Tokens</span>
            <span className="text-xl font-bold text-astrology-gold">1,208</span>
          </div>
        </div>
      </div>

      <div className="bg-astrology-card rounded-xl border border-astrology-gold/10 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-black/20 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Zodiac (Rasi)</th>
              <th className="px-6 py-4">Joined Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No users found</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-astrology-gold/10 flex items-center justify-center text-astrology-gold font-bold border border-astrology-gold/20">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white group-hover:text-astrology-gold transition-colors">{user.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail size={12} /> {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-black/40 border border-white/10 px-3 py-1 rounded-full text-sm text-astrology-gold">
                    {user.rasi || 'Not Selected'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} /> {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-all title='Delete User'">
                    <UserMinus size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Users
