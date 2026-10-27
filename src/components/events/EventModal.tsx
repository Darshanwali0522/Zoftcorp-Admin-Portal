'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  Loader2,
  Calendar,
  MapPin,
  Globe,
  Video,
  Plus,
  Trash2,
  Sparkles,
  Link2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { EventItem, EventFormValues, ContentStatus } from '@/types/events';
import { uploadEventPhoto } from '@/lib/supabase/events-service';
import { slugify } from '@/lib/utils';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: EventFormValues) => Promise<{ success: boolean; error?: string }>;
  event?: EventItem | null;
}

export function EventModal({ isOpen, onClose, onSave, event }: EventModalProps) {
  const isEditing = Boolean(event);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState('meetup');
  const [registrationUrl, setRegistrationUrl] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [status, setStatus] = useState<ContentStatus>('draft');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualPhotoUrl, setShowManualPhotoUrl] = useState(false);
  const [manualPhotoUrl, setManualPhotoUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to convert ISO string to datetime-local value (YYYY-MM-DDTHH:MM)
  const toDateTimeLocal = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (event) {
        setTitle(event.title || '');
        setSlug(event.slug || '');
        setDescription(event.description || '');
        setEventDate(toDateTimeLocal(event.event_date));
        setLocation(event.location || '');
        setEventType(event.event_type || 'meetup');
        setRegistrationUrl(event.registration_url || '');
        setRecordingUrl(event.recording_url || '');
        setPhotos(Array.isArray(event.photos) ? event.photos : []);
        setStatus(event.status || 'draft');
      } else {
        setTitle('');
        setSlug('');
        setDescription('');
        // Default to upcoming date (tomorrow at 15:00)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 7);
        tomorrow.setHours(15, 0, 0, 0);
        setEventDate(toDateTimeLocal(tomorrow.toISOString()));
        setLocation('Virtual / Live Stream');
        setEventType('meetup');
        setRegistrationUrl('');
        setRecordingUrl('');
        setPhotos([]);
        setStatus('draft');
      }
      setFormError(null);
      setUploadError(null);
      setShowManualPhotoUrl(false);
      setManualPhotoUrl('');
    }
  }, [isOpen, event]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isEditing) {
      setSlug(slugify(val));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    const newUploadedUrls: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid format. Allowed: JPEG, PNG, WebP.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name}: Size exceeds 5 MB.`);
        continue;
      }

      const res = await uploadEventPhoto(file);
      if (res.error) {
        errors.push(`${file.name}: ${res.error}`);
      } else if (res.url) {
        newUploadedUrls.push(res.url);
      }
    }

    if (newUploadedUrls.length > 0) {
      setPhotos((prev) => [...prev, ...newUploadedUrls]);
    }
    if (errors.length > 0) {
      setUploadError(errors.join(' | '));
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddManualPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualPhotoUrl.trim()) {
      setPhotos((prev) => [...prev, manualPhotoUrl.trim()]);
      setManualPhotoUrl('');
      setShowManualPhotoUrl(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMakeCoverPhoto = (index: number) => {
    if (index === 0) return;
    setPhotos((prev) => {
      const target = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [target, ...rest];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Event title is required.');
      return;
    }
    if (!description.trim()) {
      setFormError('Event description is required.');
      return;
    }
    if (!eventDate.trim()) {
      setFormError('Event date and time is required.');
      return;
    }

    setIsSubmitting(true);
    const result = await onSave({
      title: title.trim(),
      slug: slug.trim() || slugify(title),
      description: description.trim(),
      event_date: new Date(eventDate).toISOString(),
      location: location.trim() || undefined,
      event_type: eventType.trim() || 'meetup',
      registration_url: registrationUrl.trim() || undefined,
      recording_url: recordingUrl.trim() || undefined,
      photos,
      status,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setFormError(result.error || 'Failed to save event.');
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Event / Meetup' : 'Create New Event / Meetup'}
      description={
        isEditing
          ? 'Update session details, photos, or toggle publication.'
          : 'Schedule a webinar, technical meetup, or architecture session.'
      }
      maxWidth="2xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="event-form"
            variant="primary"
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </span>
            ) : isEditing ? (
              'Update Event'
            ) : (
              'Create Event'
            )}
          </Button>
        </>
      }
    >
      <form id="event-form" onSubmit={handleSubmit} className="space-y-6">
        {formError && <Alert type="error" message={formError} />}

        {/* 1. Title & Slug */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Event Title *"
            placeholder="e.g. Cloud Database FinOps Summit"
            value={title}
            onChange={handleTitleChange}
            required
          />
          <Input
            label="Slug (URL identifier) *"
            placeholder="e.g. cloud-database-finops-summit"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            helperText="Auto-generated URL identifier"
            required
          />
        </div>

        {/* 2. Date, Time & Event Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Event Date & Time *"
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              helperText="Date & time in your local time zone"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Event Format *
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00B3FF]/40 focus:border-[#00B3FF]"
            >
              <option value="meetup">Community Meetup</option>
              <option value="webinar">Technical Webinar</option>
              <option value="architecture-session">Architecture Session</option>
              <option value="workshop">Hands-on Workshop</option>
            </select>
          </div>
        </div>

        {/* 3. Location & Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Input
              label="Location / Venue"
              placeholder="e.g. Virtual / Live Stream or Bengaluru"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div>
            <Input
              label="Registration URL"
              placeholder="https://..."
              value={registrationUrl}
              onChange={(e) => setRegistrationUrl(e.target.value)}
            />
          </div>
          <div>
            <Input
              label="Recording URL (Past)"
              placeholder="https://youtube.com/..."
              value={recordingUrl}
              onChange={(e) => setRecordingUrl(e.target.value)}
            />
          </div>
        </div>

        {/* 4. Description */}
        <Textarea
          label="Event Description *"
          placeholder="Comprehensive description of topics, takeaways, technical context, and schedule..."
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        {/* 5. Photos Gallery Management */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                Event Photos &amp; Promotional Assets
              </label>
              <span className="text-[11px] text-slate-500">
                Upload one or more event photos (JPEG, PNG, WebP up to 5 MB). The first photo serves as the cover thumbnail.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowManualPhotoUrl(!showManualPhotoUrl)}
              className="text-xs font-medium text-[#0066CC] hover:underline flex items-center gap-1"
            >
              <Link2 className="h-3 w-3" />
              <span>{showManualPhotoUrl ? 'Hide manual link' : 'Paste photo URL'}</span>
            </button>
          </div>

          {showManualPhotoUrl && (
            <div className="flex gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={manualPhotoUrl}
                onChange={(e) => setManualPhotoUrl(e.target.value)}
                className="flex-1 h-9 px-3 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#00B3FF]"
              />
              <Button type="button" size="sm" variant="outline" onClick={handleAddManualPhoto}>
                Add URL
              </Button>
            </div>
          )}

          {uploadError && <Alert type="warning" message={uploadError} />}

          {/* Photo Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {photos.map((photo, index) => (
              <div
                key={photo + index}
                className="relative group rounded-xl border border-slate-200 bg-slate-50 overflow-hidden aspect-video flex items-center justify-center shadow-xs"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                {/* Cover badge */}
                {index === 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-[#01153B]/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                    Cover
                  </span>
                )}
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => handleMakeCoverPhoto(index)}
                      className="p-1 rounded bg-white text-slate-700 hover:text-[#0066CC] text-[10px] font-semibold"
                      title="Set as Cover"
                    >
                      Make Cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                    title="Remove Photo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Upload Button Tile */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border-2 border-dashed border-slate-300 hover:border-[#00B3FF] bg-slate-50/50 hover:bg-[#00B3FF]/5 transition-all aspect-video flex flex-col items-center justify-center cursor-pointer p-3 text-center"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[#00B3FF] mb-1" />
                  <span className="text-[10px] font-medium text-slate-500">Uploading...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-500 group-hover:text-slate-800">
                  <Plus className="h-5 w-5 text-[#00B3FF] mb-1" />
                  <span className="text-xs font-semibold text-slate-700">Add Photos</span>
                  <span className="text-[10px] text-slate-400">JPEG, PNG, WebP</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6. Publication Status */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
              Publication Visibility
            </span>
            <span className="text-xs text-slate-500">
              Published events will immediately appear on the public website schedule. Drafts remain visible only to admins.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStatus('draft')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                status === 'draft'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Draft
            </button>
            <button
              type="button"
              onClick={() => setStatus('published')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                status === 'published'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Published
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
