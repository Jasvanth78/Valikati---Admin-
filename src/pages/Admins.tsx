import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Shield } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/admin`
});

interface Admin {
  id: string;
  email: string;
}

const Admins = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data } = await api.get('/admins');
      setAdmins(data);
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    try {
      await api.post('/admins', { email, password });
      setEmail('');
      setPassword('');
      fetchAdmins();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this admin?')) return;
    try {
      await api.delete(`/admins/${id}`);
      fetchAdmins();
    } catch (error) {
      alert('Failed to delete admin');
    }
  };

  if (loading) return <div className="p-8 text-center text-astrology-gold">Fetching admins...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-astrology-gold/10 rounded-xl">
          <Shield className="text-astrology-gold" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Management</h1>
          <p className="text-gray-400 text-sm">Add or remove administrator accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Admin Form */}
        <div className="md:col-span-1">
          <div className="bg-[#1A231E] rounded-2xl p-6 border border-astrology-gold/10 shadow-lg">
            <h2 className="text-lg font-bold mb-4 text-astrology-gold">Add New Admin</h2>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#121915] border border-astrology-gold/20 rounded-xl p-3 text-white focus:outline-none focus:border-astrology-gold/50"
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#121915] border border-astrology-gold/20 rounded-xl p-3 text-white focus:outline-none focus:border-astrology-gold/50"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-astrology-gold text-[#0D4730] font-bold py-3 px-4 rounded-xl hover:bg-opacity-90 flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Adding...' : <><Plus size={20} /> Add Admin</>}
              </button>
            </form>
          </div>
        </div>

        {/* Admin List */}
        <div className="md:col-span-2">
          <div className="bg-[#1A231E] rounded-2xl p-6 border border-astrology-gold/10 shadow-lg">
            <h2 className="text-lg font-bold mb-4">Current Admins</h2>
            <div className="space-y-3">
              {admins.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No admins found</p>
              ) : (
                admins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-4 bg-[#121915] rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-astrology-gold/10 flex items-center justify-center text-astrology-gold font-bold">
                        {admin.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{admin.email}</p>
                        <p className="text-xs text-gray-400">ID: {admin.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Remove Admin"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admins;
