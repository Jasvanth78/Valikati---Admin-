import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Settings } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface SpecialFeature {
  id: string;
  titleTa: string;
  titleEn: string;
  subtitleTa: string;
  subtitleEn: string;
  imageUrl: string | null;
  bgColor: string;
  textColor: string;
  isIcon: boolean;
  screen: string;
  order: number;
  isEnabled: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const SpecialFeatures = () => {
  const [features, setFeatures] = useState<SpecialFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<SpecialFeature>>({
    titleTa: '',
    titleEn: '',
    subtitleTa: '',
    subtitleEn: '',
    bgColor: '#FFFFFF',
    textColor: '#000000',
    isIcon: false,
    screen: '',
    order: 0,
    isEnabled: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const response = await axios.get(`${API_URL}/special-features`);
      setFeatures(response.data);
    } catch (error) {
      toast.error('Failed to fetch special features');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormData({
      titleTa: '',
      titleEn: '',
      subtitleTa: '',
      subtitleEn: '',
      bgColor: '#FFFFFF',
      textColor: '#000000',
      isIcon: false,
      screen: '',
      order: 0,
      isEnabled: true,
    });
    setSelectedFile(null);
    setImagePreview(null);
    setEditingId(null);
    setIsAdding(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (feature: SpecialFeature) => {
    setFormData(feature);
    setEditingId(feature.id);
    setIsAdding(true); // Open modal
    setImagePreview(feature.imageUrl ? `${API_URL.replace('/api', '')}${feature.imageUrl}` : null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this feature?')) {
      try {
        await axios.delete(`${API_URL}/special-features/${id}`);
        toast.success('Feature deleted successfully');
        fetchFeatures();
      } catch (error) {
        toast.error('Failed to delete feature');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key as keyof SpecialFeature] !== undefined) {
        submitData.append(key, formData[key as keyof SpecialFeature]!.toString());
      }
    });

    if (selectedFile) {
      submitData.append('image', selectedFile);
    }

    try {
      if (editingId) {
        await axios.put(`${API_URL}/special-features/${editingId}`, submitData);
        toast.success('Feature updated successfully');
      } else {
        await axios.post(`${API_URL}/special-features`, submitData);
        toast.success('Feature created successfully');
      }
      fetchFeatures();
      resetForm();
    } catch (error) {
      toast.error('Failed to save feature. (Is the backend deployed?)');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">
            Special Features
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage dynamic cards and navigation routes.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">Add Feature</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {features.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
            <Settings className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No special features found.</p>
            <p className="text-gray-400 text-sm mt-1">Click the "Add Feature" button to create one.</p>
          </div>
        ) : (
          features.map((feature) => (
            <div 
              key={feature.id} 
              className="group bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col transform hover:-translate-y-1"
            >
              <div 
                className="h-36 flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: feature.bgColor }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent"></div>
                {feature.imageUrl ? (
                  <img
                    src={`${API_URL.replace('/api', '')}${feature.imageUrl}`}
                    alt={feature.titleEn}
                    className={`relative z-10 drop-shadow-lg transition-transform duration-500 group-hover:scale-110 ${feature.isIcon ? "h-16 w-16" : "h-24 w-24 object-contain"}`}
                  />
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 relative z-10">
                    <ImageIcon className="h-8 w-8 text-white/70" />
                  </div>
                )}
                
                <div className="absolute top-3 right-3 flex space-x-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => handleEdit(feature)}
                    className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-primary-600 hover:bg-primary-50 transition-colors shadow-sm"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(feature.id)}
                    className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {!feature.isEnabled && (
                  <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-semibold text-white z-20">
                    Disabled
                  </div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{feature.titleEn}</h3>
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">Order: {feature.order}</span>
                </div>
                <h4 className="text-sm font-medium text-primary-600 mb-3">{feature.titleTa}</h4>
                
                <div className="mt-auto space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Route:</span>
                    <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">{feature.screen}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Theme:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: feature.bgColor }}></div>
                      <div className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: feature.textColor }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={resetForm}></div>
          
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-10 animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-5 flex justify-between items-center z-20">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{editingId ? 'Edit Feature' : 'Create New Feature'}</h2>
                <p className="text-sm text-gray-500 mt-1">Customize the appearance and behavior of this card.</p>
              </div>
              <button onClick={resetForm} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Titles Section */}
                <div className="space-y-5 col-span-1 md:col-span-2 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Text Content</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title (Tamil) <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="titleTa"
                        value={formData.titleTa}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                        placeholder="e.g. பஞ்சாங்கம்"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title (English) <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="titleEn"
                        value={formData.titleEn}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                        placeholder="e.g. Panchangam"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle (Tamil) <span className="text-gray-400 font-normal text-xs ml-1">(Optional)</span></label>
                      <input
                        type="text"
                        name="subtitleTa"
                        value={formData.subtitleTa}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle (English) <span className="text-gray-400 font-normal text-xs ml-1">(Optional)</span></label>
                      <input
                        type="text"
                        name="subtitleEn"
                        value={formData.subtitleEn}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Appearance Section */}
                <div className="space-y-5 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Appearance</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <input
                          type="color"
                          name="bgColor"
                          value={formData.bgColor}
                          onChange={handleInputChange}
                          className="h-12 w-12 border-0 rounded-xl cursor-pointer shadow-sm absolute opacity-0 inset-0"
                        />
                        <div className="h-12 w-12 rounded-xl shadow-sm border border-gray-200 pointer-events-none" style={{ backgroundColor: formData.bgColor }}></div>
                      </div>
                      <input
                        type="text"
                        name="bgColor"
                        value={formData.bgColor}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-mono uppercase bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <input
                          type="color"
                          name="textColor"
                          value={formData.textColor}
                          onChange={handleInputChange}
                          className="h-12 w-12 border-0 rounded-xl cursor-pointer shadow-sm absolute opacity-0 inset-0"
                        />
                        <div className="h-12 w-12 rounded-xl shadow-sm border border-gray-200 pointer-events-none" style={{ backgroundColor: formData.textColor }}></div>
                      </div>
                      <input
                        type="text"
                        name="textColor"
                        value={formData.textColor}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-mono uppercase bg-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Card Image</label>
                    <div className="flex items-center space-x-5">
                      <div 
                        className="h-20 w-20 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden shadow-inner border border-gray-200/50 relative group"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ backgroundColor: formData.bgColor }}
                      >
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-20"></div>
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="h-full w-full object-contain p-2 z-10 relative" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-white drop-shadow-md z-10 relative" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                        >
                          Upload Image
                        </button>
                        <p className="mt-2 text-xs text-gray-500 font-medium">
                          PNG or WebP (Transparent bg recommended)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuration Section */}
                <div className="space-y-5 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Configuration</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Screen Route Key <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="screen"
                      value={formData.screen}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. daily_rasi"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-mono text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                    <input
                      type="number"
                      name="order"
                      value={formData.order}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                    />
                  </div>

                  <div className="pt-3 space-y-4">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          name="isIcon"
                          checked={formData.isIcon}
                          onChange={handleInputChange}
                          className="peer sr-only"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Display as Small Icon</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          name="isEnabled"
                          checked={formData.isEnabled}
                          onChange={handleInputChange}
                          className="peer sr-only"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Enable Feature Card</span>
                    </label>
                  </div>
                </div>

              </div>

              <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300 flex items-center space-x-2 font-bold transform hover:-translate-y-0.5"
                >
                  <Save className="h-5 w-5" />
                  <span>{editingId ? 'Save Changes' : 'Create Feature'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialFeatures;
