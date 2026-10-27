'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2, Link2, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Partner, PartnerFormValues, ContentStatus } from '@/types/partners';
import { uploadPartnerLogo } from '@/lib/supabase/partners-service';

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: PartnerFormValues) => Promise<{ success: boolean; error?: string }>;
  partner?: Partner | null;
}

export function PartnerModal({ isOpen, onClose, onSave, partner }: PartnerModalProps) {
  const isEditing = Boolean(partner);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [status, setStatus] = useState<ContentStatus>('published');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [manualInputUrl, setManualInputUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens or partner changes
  useEffect(() => {
    if (isOpen) {
      if (partner) {
        setName(partner.name || '');
        setSlug(partner.slug || '');
        setDescription(partner.description || '');
        setDetails(partner.details || '');
        setLogoUrl(partner.logo_url || '');
        setStatus(partner.status || 'published');
      } else {
        setName('');
        setSlug('');
        setDescription('');
        setDetails('');
        setLogoUrl('');
        setStatus('published');
      }
      setFormError(null);
      setUploadError(null);
      setShowManualUrl(false);
      setManualInputUrl('');
    }
  }, [isOpen, partner]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side file format validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid format. Only PNG, JPEG, WebP, and SVG vector files are permitted.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Client-side size validation: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds the 5 MB limit.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const res = await uploadPartnerLogo(file);
    setIsUploading(false);

    if (res.error) {
      setUploadError(res.error);
    } else if (res.url) {
      setLogoUrl(res.url);
      setUploadError(null);
    }
  };

  const handleApplyManualUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInputUrl.trim()) {
      setLogoUrl(manualInputUrl.trim());
      setShowManualUrl(false);
      setManualInputUrl('');
      setUploadError(null);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Form field validation
    if (!name.trim()) {
      setFormError('Partner name is required.');
      return;
    }
    if (!description.trim()) {
      setFormError('Short description is required.');
      return;
    }
    if (!logoUrl.trim()) {
      setFormError('Partner logo or image is required.');
      return;
    }

    setIsSubmitting(true);
    const result = await onSave({
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim(),
      details: details.trim() || undefined,
      logo_url: logoUrl.trim(),
      status,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setFormError(result.error || 'Failed to save partner record.');
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Partner: ${partner?.name}` : 'Add New Partner'}
      description={
        isEditing
          ? 'Update partner details, replace logo, or modify visibility.'
          : 'Create a new technology partner ecosystem record.'
      }
      maxWidth="lg"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="partner-form"
            variant="orange"
            size="sm"
            isLoading={isSubmitting}
            disabled={isSubmitting || isUploading}
          >
            {isEditing ? 'Save Changes' : 'Create Partner'}
          </Button>
        </>
      }
    >
      <form id="partner-form" onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <Alert type="error" message={formError} onClose={() => setFormError(null)} />
        )}

        <Input
          label="Partner Name *"
          id="partner-name"
          placeholder="e.g. AWS, Microsoft Azure, Google Cloud, Oracle"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Identifier / URL Slug (Optional)"
          id="partner-slug"
          placeholder="e.g. aws, azure, gcp, oracle (auto-generated if empty)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          helperText="Unique identifier used for links and website integrations."
        />

        <Textarea
          label="Short Description *"
          id="partner-description"
          rows={2}
          placeholder="e.g. ZOFT's work across enterprise cloud and database environments."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <Textarea
          label="Extended Details (Optional)"
          id="partner-details"
          rows={3}
          placeholder="Technical capabilities, migration architecture, database advisory details..."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          helperText="Detailed copy for deep-dive partnership pages."
        />

        {/* Logo / Image Upload Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Partner Logo / Image *
            </label>
            <button
              type="button"
              onClick={() => setShowManualUrl(!showManualUrl)}
              className="text-xs text-[#0088CC] hover:text-[#01153B] inline-flex items-center gap-1 font-medium cursor-pointer"
            >
              <Link2 className="h-3 w-3" />
              {showManualUrl ? 'Upload File' : 'Paste Asset / CDN Path'}
            </button>
          </div>

          {showManualUrl && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="/platforms/aws.svg or https://..."
                value={manualInputUrl}
                onChange={(e) => setManualInputUrl(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#00B3FF]"
              />
              <Button type="button" size="sm" variant="primary" onClick={handleApplyManualUrl}>
                Apply
              </Button>
            </div>
          )}

          {/* Logo Preview or Drop Area */}
          {logoUrl ? (
            <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-lg bg-white border border-slate-200 p-2 flex items-center justify-center shrink-0 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="Partner Logo Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Logo configured</span>
                  </p>
                  <p className="text-[11px] text-slate-500 truncate max-w-xs" title={logoUrl}>
                    {logoUrl}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  title="Replace logo"
                >
                  Replace
                </Button>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Remove logo"
                  aria-label="Remove logo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-[#00B3FF] rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-[#00B3FF]/5"
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center py-2 text-slate-600">
                  <Loader2 className="h-8 w-8 animate-spin text-[#00B3FF] mb-2" />
                  <span className="text-xs font-medium">Validating and uploading logo...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="h-10 w-10 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-500 mb-2">
                    <UploadCloud className="h-5 w-5 text-[#00B3FF]" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    Click to upload partner logo
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    PNG, JPEG, WebP, or SVG (vector) • Max 5 MB
                  </p>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploadError && (
            <p className="text-xs text-rose-600 font-medium">{uploadError}</p>
          )}
        </div>

        {/* Publication Status */}
        <Select
          label="Visibility Status"
          id="partner-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ContentStatus)}
          options={[
            { value: 'published', label: 'Published (Visible on main website)' },
            { value: 'draft', label: 'Draft (Internal admin only)' },
          ]}
          helperText="Draft partners remain hidden from public website visitors."
        />
      </form>
    </Modal>
  );
}
