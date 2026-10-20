'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Tags as TagsIcon,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Tag as TagIcon,
} from 'lucide-react';
import { Tag } from '@/types/blog';
import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
} from '@/lib/supabase/taxonomy-service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';

export function TagsManager() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal State
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await getTags();
    if (res.error) {
      setError(res.error);
    } else {
      setTags(res.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    getTags().then((res) => {
      if (isCancelled) return;
      if (res.error) {
        setError(res.error);
      } else {
        setTags(res.data);
      }
      setIsLoading(false);
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleOpenAddModal = () => {
    setEditingTag(null);
    setFormName('');
    setFormSlug('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: Tag) => {
    setEditingTag(t);
    setFormName(t.name);
    setFormSlug(t.slug);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    if (editingTag) {
      const res = await updateTag(editingTag.id, formName.trim(), formSlug.trim());
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(`Tag "${formName}" updated successfully.`);
        setIsModalOpen(false);
        loadData();
      }
    } else {
      const res = await createTag(formName.trim(), formSlug.trim());
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(`Tag "${formName}" created successfully.`);
        setIsModalOpen(false);
        loadData();
      }
    }
    setIsSubmitting(false);
  };

  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return;
    setIsDeleting(true);

    const res = await deleteTag(tagToDelete.id);
    setIsDeleting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(`Tag "${tagToDelete.name}" deleted from tag directory.`);
      setTagToDelete(null);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}
      {error && (
        <Alert
          type="error"
          title="Tag Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#01153B] tracking-tight flex items-center gap-2">
            <TagsIcon className="h-6 w-6 text-[#00B3FF]" />
            Tags Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage granular keywords, technology versions, and search tags.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="orange"
            size="sm"
            onClick={handleOpenAddModal}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Tag
          </Button>
        </div>
      </div>

      {/* Tags Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="px-5 py-3.5">Tag Name</th>
                <th className="px-4 py-3.5">Slug</th>
                <th className="px-4 py-3.5 text-center">Articles Using Tag</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-10 bg-slate-200 rounded mx-auto" /></td>
                    <td className="px-5 py-4 text-right"><div className="h-7 w-16 bg-slate-200 rounded inline-block" /></td>
                  </tr>
                ))
              ) : tags.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    <TagIcon className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    No tags found. Click &quot;Add Tag&quot; to create one.
                  </td>
                </tr>
              ) : (
                tags.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-bold text-[#01153B] whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md text-xs font-semibold">
                        #{t.name}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                      /{t.slug}
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00B3FF]/15 text-[#0077B6]">
                        {t.post_count || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditModal(t)}
                          className="h-8 px-2 text-slate-600 hover:text-[#01153B]"
                          title="Edit Tag"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTagToDelete(t)}
                          className="h-8 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Tag"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Tag Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTag ? 'Edit Tag' : 'Create New Tag'}
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleFormSubmit}
            >
              {editingTag ? 'Save Changes' : 'Create Tag'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Tag Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. SQL Server 2022"
            required
          />

          <Input
            label="URL Slug (Optional)"
            value={formSlug}
            onChange={(e) => setFormSlug(e.target.value)}
            placeholder="Auto-generated if left blank"
          />
        </form>
      </Modal>

      {/* Delete Tag Modal */}
      <Modal
        isOpen={Boolean(tagToDelete)}
        onClose={() => setTagToDelete(null)}
        title="Delete Tag"
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTagToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteConfirm}
            >
              Delete Tag
            </Button>
          </>
        }
      >
        {tagToDelete && (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Are you sure you want to delete tag <strong className="text-slate-900">&quot;{tagToDelete.name}&quot;</strong>?
            </p>
            <p className="text-xs text-slate-500">
              This removes the tag from the global directory. Existing articles will retain their current tag strings.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
