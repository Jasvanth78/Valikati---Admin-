import React, { useState, useEffect } from 'react';
import { Save, AlertTriangle, FileText, Shield, Image } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/admin`
});

const Settings = () => {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ta: '', en: '' });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data } = await api.get('/app-content');
      setContent(data);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const keys = [
    { key: 'app_name', label: '📱 App Name', icon: <Save size={20} /> },
    { key: 'home_banner_subtitle', label: '🏠 Home Banner Subtitle', icon: <Save size={20} /> },
    { key: 'home_banner_image_url', label: '🖼️ Home Banner Image URL', icon: <Image size={20} /> },
    { key: 'terms_and_conditions', label: 'Terms & Conditions', icon: <FileText size={20} /> },
    { key: 'privacy_policy', label: 'Privacy Policy', icon: <Shield size={20} /> },
    { key: 'disclaimer', label: 'App Disclaimer', icon: <AlertTriangle size={20} /> },
  ];

  const handleEdit = (item: any) => {
    setEditingKey(item.key);
    setFormData({ ta: item.ta || '', en: item.en || '' });
  };

  const handleSave = async (key: string) => {
    try {
      await api.put('/app-content', { key, ...formData });
      fetchContent();
      setEditingKey(null);
      alert('Content updated and broadcast live!');
    } catch (error) {
      alert('Failed to update content');
    }
  };

  if (loading) return <div className="p-8 text-center text-astrology-gold">Connecting to the stars...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold bg-gold-gradient bg-clip-text text-transparent italic">App Content Management</h2>
      </div>

      <div className="grid gap-6">
        {keys.map(({ key, label, icon }) => {
          const item = content.find(c => c.key === key) || { key, ta: '', en: '' };
          const isEditing = editingKey === key;

          return (
            <div key={key} className="bg-astrology-card border border-astrology-gold/20 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-astrology-gold">
                  {icon}
                  <h3 className="text-lg font-bold">{label}</h3>
                </div>
                {!isEditing && (
                  <button 
                    onClick={() => handleEdit(item)}
                    className="px-4 py-2 border border-astrology-gold/40 text-astrology-gold rounded-lg hover:bg-astrology-gold/10 transition-all text-sm"
                  >
                    Edit Content
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tamil Version</label>
                      <textarea 
                        className="w-full h-48 bg-astrology-dark border border-astrology-gold/20 rounded-lg p-4 text-white focus:outline-none focus:border-astrology-gold transition-colors resize-none"
                        placeholder="Enter Tamil content..."
                        value={formData.ta}
                        onChange={(e) => setFormData({ ...formData, ta: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">English Version</label>
                      <textarea 
                        className="w-full h-48 bg-astrology-dark border border-astrology-gold/20 rounded-lg p-4 text-white focus:outline-none focus:border-astrology-gold transition-colors resize-none"
                        placeholder="Enter English content..."
                        value={formData.en}
                        onChange={(e) => setFormData({ ...formData, en: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setEditingKey(null)}
                      className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleSave(key)}
                      className="px-6 py-2 bg-gold-gradient text-astrology-dark font-bold rounded-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all flex items-center gap-2"
                    >
                      <Save size={18} />
                      Save & Publish Live
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6 p-4 bg-astrology-dark/50 rounded-lg border border-white/5">
                  <div className="space-y-2">
                    <span className="text-[10px] text-astrology-gold/60 font-bold uppercase">Tamil Preview</span>
                    <p className="text-sm text-gray-400 line-clamp-3 italic">
                      {item.ta || "No content added yet."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] text-astrology-gold/60 font-bold uppercase">English Preview</span>
                    <p className="text-sm text-gray-400 line-clamp-3 italic">
                      {item.en || "No content added yet."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Settings;
