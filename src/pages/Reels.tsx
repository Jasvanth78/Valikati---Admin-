import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Play, Settings } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Reel {
  id: string;
  youtubeVideoId: string;
  title: string;
  description: string;
  hashtags: string[];
  likesCount: number;
  isEnabled: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7006';
const API_URL = `${API_BASE_URL}/api`;

const Reels = () => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeVideoId: '',
    hashtags: '',
  });

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      const response = await axios.get(`${API_URL}/reels`);
      setReels(response.data);
    } catch (error) {
      toast.error('Failed to fetch reels');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      youtubeVideoId: '',
      hashtags: '',
    });
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this reel?')) {
      try {
        await axios.delete(`${API_URL}/reels/${id}`);
        toast.success('Reel deleted successfully');
        fetchReels();
      } catch (error) {
        toast.error('Failed to delete reel');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const tags = formData.hashtags
      .split(',')
      .map(t => t.trim())
      .filter(t => t !== '');

    try {
      await axios.post(`${API_URL}/reels`, {
        ...formData,
        hashtags: tags,
      });
      toast.success('Reel created successfully');
      fetchReels();
      resetForm();
    } catch (error) {
      toast.error('Failed to save reel.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-astrology-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center bg-astrology-card p-6 rounded-xl border border-astrology-gold/10">
        <div>
          <h1 className="text-2xl font-bold text-astrology-gold">
            Reels & Videos
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage YouTube shorts/videos shown in the app.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-2 bg-astrology-gold text-black px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-astrology-gold/20 transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">Add Video</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {reels.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-xl bg-black/20">
            <Play className="h-12 w-12 text-gray-600 mb-4" />
            <p className="text-gray-400 font-medium">No videos found.</p>
            <p className="text-gray-500 text-sm mt-1">Click the "Add Video" button to add one.</p>
          </div>
        ) : (
          reels.map((reel) => (
            <div key={reel.id} className="bg-astrology-card rounded-xl border border-astrology-gold/10 overflow-hidden hover:border-astrology-gold/40 transition-all duration-300 flex flex-col">
              <div className="relative aspect-video bg-black/50">
                <img 
                  src={`https://img.youtube.com/vi/${reel.youtubeVideoId}/hqdefault.jpg`} 
                  alt={reel.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
                  <div className="w-12 h-12 bg-astrology-gold/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-astrology-gold">
                    <Play className="w-6 h-6 text-black ml-1" />
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(reel.id)}
                  className="absolute top-3 right-3 p-2 bg-black/80 backdrop-blur-md rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors border border-red-500/30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-white line-clamp-1">{reel.title}</h3>
                <p className="text-gray-400 text-sm mt-1 line-clamp-2 flex-1">{reel.description}</p>
                
                <div className="mt-4 flex gap-2 flex-wrap">
                  {reel.hashtags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-astrology-gold/10 text-astrology-gold text-xs rounded-md font-medium border border-astrology-gold/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-astrology-card border border-astrology-gold/20 rounded-xl p-8 w-full max-w-xl shadow-2xl">
            <h2 className="text-2xl font-bold text-astrology-gold mb-6">Add New Video</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-black/50 border border-astrology-gold/20 text-white focus:ring-1 focus:ring-astrology-gold focus:border-astrology-gold outline-none transition-all placeholder-gray-600"
                  placeholder="Enter video title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">YouTube Video ID or Link</label>
                <input
                  type="text"
                  name="youtubeVideoId"
                  required
                  value={formData.youtubeVideoId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-black/50 border border-astrology-gold/20 text-white focus:ring-1 focus:ring-astrology-gold focus:border-astrology-gold outline-none transition-all placeholder-gray-600"
                  placeholder="e.g. dQw4w9WgXcQ or https://youtu.be/dQw4w9WgXcQ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-black/50 border border-astrology-gold/20 text-white focus:ring-1 focus:ring-astrology-gold focus:border-astrology-gold outline-none transition-all resize-none placeholder-gray-600"
                  placeholder="Enter description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Hashtags (comma separated)</label>
                <input
                  type="text"
                  name="hashtags"
                  value={formData.hashtags}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-black/50 border border-astrology-gold/20 text-white focus:ring-1 focus:ring-astrology-gold focus:border-astrology-gold outline-none transition-all placeholder-gray-600"
                  placeholder="e.g. #dev, #astrology"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border border-gray-600 text-gray-400 rounded-lg hover:bg-white/5 hover:text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-astrology-gold text-black rounded-lg hover:bg-yellow-500 font-bold transition-all shadow-lg hover:shadow-astrology-gold/20"
                >
                  Save Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reels;
