'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  FolderOpen,
  AlertTriangle,
} from 'lucide-react';
import { Category } from '@/types/blog';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/supabase/taxonomy-service';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';

export function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal State
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await getCategories();
    if (res.error) {
      setError(res.error);
    } else {
      setCategories(res.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    getCategories().then((res) => {
      if (isCancelled) return;
      if (res.error) {
        setError(res.error);
      } else {
        setCategories(res.data);
      }
      setIsLoading(false);
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    if (editingCategory) {
      const res = await updateCategory(
        editingCategory.id,
        formName.trim(),
        formSlug.trim(),
        formDescription.trim()
      );
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(`Category "${formName}" updated successfully.`);
        setIsModalOpen(false);
        loadData();
      }
    } else {
      const res = await createCategory(
        formName.trim(),
        formDescription.trim(),
        formSlug.trim()
      );
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(`Category "${formName}" created successfully.`);
        setIsModalOpen(false);
        loadData();
      }
    }
    setIsSubmitting(false);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);

    const res = await deleteCategory(categoryToDelete.id, categoryToDelete.slug);
    setIsDeleting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(
        `Category "${categoryToDelete.name}" deleted. ${
          res.affectedPosts ? `${res.affectedPosts} post(s) safely reassigned to "General".` : ''
        }`
      );
      setCategoryToDelete(null);
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
          title="Category Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#01153B] tracking-tight flex items-center gap-2">
            <FolderTree className="h-6 w-6 text-[#00B3FF]" />
            Categories Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organize articles into core topics and database specializations.
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
            Add Category
          </Button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="px-5 py-3.5">Category Name</th>
                <th className="px-4 py-3.5">Slug</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-4 py-3.5 text-center">Articles</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-48 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-10 bg-slate-200 rounded mx-auto" /></td>
                    <td className="px-5 py-4 text-right"><div className="h-7 w-16 bg-slate-200 rounded inline-block" /></td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <FolderOpen className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    No categories found. Click &quot;Add Category&quot; to create one.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-bold text-[#01153B] whitespace-nowrap">
                      {cat.name}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                      /{cat.slug}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 max-w-md">
                      {cat.description || '—'}
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00B3FF]/15 text-[#0077B6]">
                        {cat.post_count || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditModal(cat)}
                          className="h-8 px-2 text-slate-600 hover:text-[#01153B]"
                          title="Edit Category"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCategoryToDelete(cat)}
                          className="h-8 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Category"
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

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
        maxWidth="md"
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
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Category Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Performance Tuning"
            required
          />

          <Input
            label="URL Slug (Optional)"
            value={formSlug}
            onChange={(e) => setFormSlug(e.target.value)}
            placeholder="Auto-generated if left blank"
            helperText="Used in public routing: /insights/blogs/category/[slug]"
          />

          <Textarea
            label="Description (Optional)"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            rows={3}
            placeholder="A brief overview of topics covered in this category..."
          />
        </form>
      </Modal>

      {/* Delete Category Confirmation Modal */}
      <Modal
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        title="Delete Category"
        maxWidth="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCategoryToDelete(null)}
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
              Yes, Delete Category
            </Button>
          </>
        }
      >
        {categoryToDelete && (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-rose-100 p-2 text-rose-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Delete &quot;{categoryToDelete.name}&quot;?
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Articles are never deleted when a category is removed. Any articles currently assigned to this category will be safely reassigned to <strong className="text-slate-800">&quot;General&quot;</strong>.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
              <p>• Category: <strong className="text-slate-800">{categoryToDelete.name}</strong></p>
              <p>• Associated Articles: <strong className="text-[#0077B6]">{categoryToDelete.post_count || 0}</strong></p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
