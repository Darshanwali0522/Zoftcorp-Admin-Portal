'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, Star } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ClientReview } from '@/types/reviews';

interface DeleteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  review: ClientReview | null;
}

export function DeleteReviewModal({
  isOpen,
  onClose,
  onConfirm,
  review,
}: DeleteReviewModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!review) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Client Review"
      maxWidth="sm"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            isLoading={isDeleting}
            disabled={isDeleting}
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={handleDelete}
          >
            Confirm Delete
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-rose-900">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold text-rose-950">
              Are you sure you want to delete this review?
            </p>
            <p className="mt-1 text-rose-800">
              This will permanently delete the review from <strong className="font-bold">{review.client_name}</strong>.
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">{review.client_name}</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-3 w-3 ${
                    s <= review.rating
                      ? 'fill-amber-400 text-amber-500'
                      : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-600 italic line-clamp-2">
            &ldquo;{review.review_text}&rdquo;
          </p>
        </div>
      </div>
    </Modal>
  );
}
