'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { ClientReview, ReviewFormValues, ContentStatus } from '@/types/reviews';
import { StarRatingInput } from './StarRatingInput';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: ReviewFormValues) => Promise<{ success: boolean; error?: string }>;
  review?: ClientReview | null;
}

export function ReviewModal({ isOpen, onClose, onSave, review }: ReviewModalProps) {
  const isEditing = Boolean(review);

  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState('');
  const [status, setStatus] = useState<ContentStatus>('published');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (review) {
        setClientName(review.client_name || '');
        setCompanyName(review.company_name || '');
        setRating(review.rating || 5);
        setReviewText(review.review_text || '');
        setStatus(review.status || 'published');
      } else {
        setClientName('');
        setCompanyName('');
        setRating(5);
        setReviewText('');
        setStatus('published');
      }
      setFormError(null);
    }
  }, [isOpen, review]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!clientName.trim()) {
      setFormError('Client name is required.');
      return;
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setFormError('Please select a valid rating between 1 and 5 stars.');
      return;
    }
    if (!reviewText.trim()) {
      setFormError('Review description / testimonial is required.');
      return;
    }

    setIsSubmitting(true);
    const result = await onSave({
      client_name: clientName.trim(),
      company_name: companyName.trim() || undefined,
      rating,
      review_text: reviewText.trim(),
      status,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setFormError(result.error || 'Failed to save review record.');
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Review from ${review?.client_name}` : 'Add Client Review'}
      description={
        isEditing
          ? 'Modify client testimonial, rating score, or visibility status.'
          : 'Record a verified client review and evaluation rating.'
      }
      maxWidth="md"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="review-form"
            variant="orange"
            size="sm"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isEditing ? 'Save Changes' : 'Create Review'}
          </Button>
        </>
      }
    >
      <form id="review-form" onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <Alert type="error" message={formError} onClose={() => setFormError(null)} />
        )}

        <Input
          label="Client Name *"
          id="client-name"
          placeholder="e.g. Sarah Jenkins, CTO or Enterprise Systems Lead"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          required
        />

        <Input
          label="Company / Organization (Optional)"
          id="company-name"
          placeholder="e.g. Apex Global Logistics, FinTech Ventures"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          helperText="Display client company affiliation alongside testimonial."
        />

        {/* 5-Star Rating Control */}
        <StarRatingInput
          value={rating}
          onChange={(r) => setRating(r)}
          label="Client Rating *"
        />

        <Textarea
          label="Review Description / Testimonial *"
          id="review-text"
          rows={4}
          placeholder="Detailed client testimonial regarding database performance, cloud migration, or engineering engagement..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          required
        />

        {/* Visibility Status */}
        <Select
          label="Publication Status"
          id="review-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ContentStatus)}
          options={[
            { value: 'published', label: 'Published (Approved for website display)' },
            { value: 'draft', label: 'Draft (Internal pending verification)' },
          ]}
          helperText="Only published reviews will be surfaced to the public website."
        />
      </form>
    </Modal>
  );
}
