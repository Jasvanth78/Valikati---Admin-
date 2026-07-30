import React, { useState, useRef } from 'react';
import { UploadCloud, X, Link, Loader2, Check } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  folder?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'Image',
  placeholder = 'https://example.com/image.png or asset path',
  folder = 'admin_uploads',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG)');
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.url) {
        onChange(data.url);
      } else {
        throw new Error(data.error || 'Failed to upload image');
      }
    } catch (err: any) {
      console.error('Upload Error:', err);
      setError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        {label && <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold">{label}</label>}
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-mono"
        >
          <Link size={12} />
          {showUrlInput ? 'Use Drag & Drop File Upload' : 'Or enter Image URL directly'}
        </button>
      </div>

      {showUrlInput ? (
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/50"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2 text-center ${
            isDragging
              ? 'border-amber-400 bg-amber-400/10 scale-[1.01]'
              : value
              ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60'
              : 'border-white/15 bg-white/5 hover:border-amber-400/50 hover:bg-white/[0.08]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          {isUploading ? (
            <div className="py-4 flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-amber-400" size={28} />
              <p className="text-xs text-amber-300 font-medium">Uploading image to Cloudinary...</p>
            </div>
          ) : value ? (
            <div className="w-full flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <img
                  src={value}
                  alt="Uploaded preview"
                  className="h-14 w-14 object-cover rounded-xl border border-white/20 shrink-0 bg-black/40"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <div className="text-left truncate">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <Check size={14} /> Image Selected / Uploaded
                  </div>
                  <p className="text-[11px] text-gray-400 truncate max-w-[200px] sm:max-w-[300px] mt-0.5">{value}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="p-1.5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 rounded-lg transition-colors"
                title="Remove Image"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="py-2 flex flex-col items-center gap-1.5">
              <div className="p-3 bg-amber-400/10 text-amber-400 rounded-full mb-1">
                <UploadCloud size={24} />
              </div>
              <p className="text-xs font-semibold text-gray-200">
                <span className="text-amber-400 underline">Click to select file</span> or drag and drop image here
              </p>
              <p className="text-[10px] text-gray-400">PNG, JPG, WEBP, GIF up to 10MB</p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-rose-400 font-medium mt-1">{error}</p>}
    </div>
  );
};
