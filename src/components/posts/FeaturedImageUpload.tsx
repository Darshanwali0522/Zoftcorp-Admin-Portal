'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2, Link2, Info } from 'lucide-react';
import { uploadBlogImage } from '@/lib/supabase/admin-auth';

interface FeaturedImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  error?: string;
}

export function FeaturedImageUpload({ value, onChange, error }: FeaturedImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const { url, error } = await uploadBlogImage(file);

    setIsUploading(false);
    if (error) {
      setUploadError(error);
    } else if (url) {
      onChange(url);
    }
  };

  const handleManualUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualUrl.trim()) {
      onChange(manualUrl.trim());
      setShowUrlInput(false);
      setManualUrl('');
    }
  };

  const handleRemove = () => {
    onChange(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Featured Image
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-[#0088CC] hover:text-[#01153B] inline-flex items-center gap-1 cursor-pointer font-medium transition-colors"
        >
          <Link2 className="h-3 w-3" />
          {showUrlInput ? 'Hide URL input' : 'Paste Image URL'}
        </button>
      </div>

      {showUrlInput && (
        <form onSubmit={handleManualUrlSubmit} className="flex gap-2 animate-in fade-in duration-150">
          <input
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://images.unsplash.com/... or CDN link"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#01153B]"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#01153B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#031E4D] cursor-pointer"
          >
            Apply
          </button>
        </form>
      )}

      {/* Image Preview or Dropzone */}
      {value ? (
        <div className="space-y-2">
          <div className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-100 max-h-56 flex items-center justify-center shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Featured post preview"
              className="w-full max-h-56 object-cover"
            />
            <div className="absolute inset-0 bg-[#01153B]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#01153B] hover:bg-slate-100 shadow-sm cursor-pointer"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 shadow-sm cursor-pointer inline-flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="h-3 w-3" /> Recommended aspect ratio: 16:9 (1200 x 630 px) for optimal social sharing.
          </p>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-[#00B3FF] rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50/70 hover:bg-[#00B3FF]/5 group"
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#00B3FF] mb-2" />
              <p className="text-xs font-bold text-[#01153B]">Uploading to Supabase Storage...</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Storing in blog-images bucket</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2">
              <div className="rounded-full bg-slate-100 p-2.5 mb-2 text-slate-600 group-hover:text-[#0088CC] group-hover:bg-[#00B3FF]/15 transition-colors">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Click to upload cover image
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                PNG, JPG, WebP, or SVG (Up to 5MB)
              </p>
              <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#01153B] bg-white border border-slate-200 rounded-md px-2.5 py-1 shadow-2xs group-hover:border-[#00B3FF]">
                <ImageIcon className="h-3 w-3 text-[#00B3FF]" /> Browse Files
              </span>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      {(uploadError || error) && (
        <p className="text-xs text-rose-600 font-semibold">{uploadError || error}</p>
      )}
    </div>
  );
}
