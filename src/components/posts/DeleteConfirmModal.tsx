import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { BlogPost } from '@/types/blog';

interface DeleteConfirmModalProps {
  post: BlogPost | null;
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  post,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!post) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Blog Post"
      maxWidth="md"
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={isDeleting}
            onClick={onConfirm}
          >
            Yes, Delete Post
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-rose-100 p-2 text-rose-600 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">
              Are you sure you want to delete this blog post?
            </p>
            <p className="text-xs text-slate-500 mt-1">
              This action cannot be undone. The post and all associated revisions will be permanently deleted from the database.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 mt-2">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Post Title</span>
          <p className="text-sm font-medium text-slate-900 line-clamp-2 mt-0.5">
            {post.title}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span>Slug: <code className="font-mono text-slate-700">{post.slug}</code></span>
            <span>•</span>
            <span className="capitalize">{post.status}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
