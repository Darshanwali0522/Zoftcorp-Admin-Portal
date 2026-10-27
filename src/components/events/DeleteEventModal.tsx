'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, Calendar, MapPin } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EventItem } from '@/types/events';

interface DeleteEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  event: EventItem | null;
}

export function DeleteEventModal({
  isOpen,
  onClose,
  onConfirm,
  event,
}: DeleteEventModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!event) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const coverPhoto = event.photos && event.photos.length > 0 ? event.photos[0] : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Event / Meetup"
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
            onClick={handleDelete}
            disabled={isDeleting}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            {isDeleting ? 'Deleting...' : 'Delete Event'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-rose-900">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold text-rose-950">
              Are you sure you want to delete this event?
            </p>
            <p className="mt-1 text-rose-800">
              This will permanently remove <strong className="font-bold">{event.title}</strong> from the database and handle its stored photos safely.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          {coverPhoto ? (
            <div className="h-12 w-16 rounded bg-slate-200 overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverPhoto}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-12 w-12 rounded bg-slate-200 flex items-center justify-center shrink-0 text-slate-500">
              <Calendar className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{event.title}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>{formatDate(event.event_date)}</span>
              {event.location && <span>• {event.location}</span>}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
