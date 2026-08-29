import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon } from 'lucide-react';
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
              type === 'number' ? parseInt(value) : value
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
    setIsAdding(false);
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
      toast.error('Failed to save feature');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Special Features (Dynamic Cards)</h1>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-5 w-5" />
            <span>Add Feature</span>
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">{editingId ? 'Edit Feature' : 'Add New Feature'}</h2>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title (Tamil)</label>
                <input
                  type="text"
                  name="titleTa"
                  value={formData.titleTa}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title (English)</label>
                <input
                  type="text"
                  name="titleEn"
                  value={formData.titleEn}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle (Tamil)</label>
                <input
                  type="text"
                  name="subtitleTa"
                  value={formData.subtitleTa}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle (English)</label>
                <input
                  type="text"
                  name="subtitleEn"
                  value={formData.subtitleEn}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    name="bgColor"
                    value={formData.bgColor}
                    onChange={handleInputChange}
                    className="h-10 w-10 border-0 p-0 rounded"
                  />
                  <input
                    type="text"
                    name="bgColor"
                    value={formData.bgColor}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    name="textColor"
                    value={formData.textColor}
                    onChange={handleInputChange}
                    className="h-10 w-10 border-0 p-0 rounded"
                  />
                  <input
                    type="text"
                    name="textColor"
                    value={formData.textColor}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Screen Key (Navigation Route)</label>
                <input
                  type="text"
                  name="screen"
                  value={formData.screen}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. nalla_neram"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex flex-col justify-center mt-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="isIcon"
                    checked={formData.isIcon}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-primary-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Display as Icon (Circle bg vs Image)</span>
                </label>
              </div>

              <div className="flex flex-col justify-center mt-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="isEnabled"
                    checked={formData.isEnabled}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-primary-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Enabled</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
              <div className="flex items-center space-x-6">
                <div 
                  className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary-500 overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ backgroundColor: formData.bgColor }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-gray-400" />
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
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Choose Image
                  </button>
                  <p className="mt-2 text-sm text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
              >
                <Save className="h-5 w-5" />
                <span>Save Feature</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <div key={feature.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div 
              className="p-6 h-32 flex items-center justify-center relative"
              style={{ backgroundColor: feature.bgColor }}
            >
              {feature.imageUrl ? (
                <img
                  src={`${API_URL.replace('/api', '')}${feature.imageUrl}`}
                  alt={feature.titleEn}
                  className={feature.isIcon ? "h-12 w-12" : "h-20 w-20"}
                />
              ) : (
                <ImageIcon className="h-12 w-12 text-gray-300" />
              )}
              <div className="absolute top-2 right-2 flex space-x-2">
                <button
                  onClick={() => handleEdit(feature)}
                  className="p-2 bg-white/80 rounded-full text-blue-600 hover:bg-white"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(feature.id)}
                  className="p-2 bg-white/80 rounded-full text-red-600 hover:bg-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg" style={{ color: feature.textColor }}>{feature.titleTa}</h3>
                  <p className="text-sm font-medium" style={{ color: feature.textColor }}>{feature.titleEn}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${feature.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {feature.isEnabled ? 'Active' : 'Hidden'}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <p>{feature.subtitleTa}</p>
                <p>{feature.subtitleEn}</p>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
                <span>Screen: {feature.screen}</span>
                <span>Order: {feature.order}</span>
              </div>
            </div>
          </div>
        ))}
        {features.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-lg border border-dashed">
            No dynamic special features added yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialFeatures;
