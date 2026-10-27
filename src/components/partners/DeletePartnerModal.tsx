'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Partner } from '@/types/partners';

interface DeletePartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  partner: Partner | null;
}

export function DeletePartnerModal({
  isOpen,
  onClose,
  onConfirm,
  partner,
}: DeletePartnerModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!partner) return null;

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
      title="Delete Partner"
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
              Are you sure you want to delete this partner?
            </p>
            <p className="mt-1 text-rose-800">
              This will permanently remove <strong className="font-bold">{partner.name}</strong> from the database and handle its stored logo safely.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="h-10 w-10 rounded bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={partner.logo_url}
              alt={partner.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{partner.name}</p>
            <p className="text-xs text-slate-500 truncate">{partner.description}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
