'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  PlusCircle,
  Search,
  RefreshCw,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ClientReview, ReviewFormValues } from '@/types/reviews';
import {
  getClientReviews,
  createClientReview,
  updateClientReview,
  deleteClientReview,
} from '@/lib/supabase/reviews-service';
import { ReviewListTable } from '@/components/reviews/ReviewListTable';
import { ReviewModal } from '@/components/reviews/ReviewModal';
import { DeleteReviewModal } from '@/components/reviews/DeleteReviewModal';

export default function ClientReviewsPage() {
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ClientReview | null>(null);
  const [deletingReview, setDeletingReview] = useState<ClientReview | null>(null);

  // Notification Toast
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  const [isSchemaMissing, setIsSchemaMissing] = useState(false);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    const res = await getClientReviews({
      search,
      rating: ratingFilter,
      status: statusFilter,
    });
    setReviews(res.data);
    setIsSchemaMissing(Boolean(res.isSchemaMissing));
    if (res.error && !res.isSchemaMissing) {
      setNotification({ type: 'error', message: res.error });
    }
    setIsLoading(false);
  }, [search, ratingFilter, statusFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleOpenAdd = () => {
    setEditingReview(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (review: ClientReview) => {
    setEditingReview(review);
    setIsModalOpen(true);
  };

  const handleSaveReview = async (
    values: ReviewFormValues
  ): Promise<{ success: boolean; error?: string }> => {
    if (editingReview) {
      const res = await updateClientReview(editingReview.id, values);
      if (res.error) {
        return { success: false, error: res.error };
      }
      setNotification({
        type: 'success',
        message: `Review from "${values.client_name}" updated successfully.`,
      });
    } else {
      const res = await createClientReview(values);
      if (res.error) {
        return { success: false, error: res.error };
      }
      setNotification({
        type: 'success',
        message: `Review from "${values.client_name}" created successfully.`,
      });
    }
    await fetchReviews();
    return { success: true };
  };

  const handleConfirmDelete = async () => {
    if (!deletingReview) return;
    const res = await deleteClientReview(deletingReview.id);
    if (!res.success) {
      setNotification({
        type: 'error',
        message: res.error || 'Failed to delete review.',
      });
    } else {
      setNotification({
        type: 'success',
        message: `Review from "${deletingReview.client_name}" deleted successfully.`,
      });
      await fetchReviews();
    }
    setDeletingReview(null);
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#01153B] tracking-tight">
              Client Reviews
            </h1>
            <span className="text-[11px] font-bold bg-[#00B3FF]/15 text-[#0077B6] px-2 py-0.5 rounded-full">
              {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage verified client testimonials, star ratings (1–5), and approval status for future website publication.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReviews}
            title="Refresh reviews"
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <Button
            variant="orange"
            size="md"
            onClick={handleOpenAdd}
            leftIcon={<PlusCircle className="h-4 w-4" />}
          >
            Add Client Review
          </Button>
        </div>
      </div>

      {/* Schema Notice Banner if Supabase Migration Pending */}
      {isSchemaMissing && (
        <Alert
          type="warning"
          title="Supabase Database Migration Required"
          message={
            <div className="text-xs leading-relaxed space-y-1">
              <p>
                The database table <code className="bg-amber-100 font-mono px-1 py-0.5 rounded">public.client_reviews</code> is not yet created in your connected Supabase instance (<code>qnahdmwjsgyxspvuntbh</code>).
              </p>
              <p>
                To enable persistent database operations, execute the safe migration in <code className="bg-amber-100 font-mono px-1 py-0.5 rounded">supabase/migrations/20261027_partners_and_reviews.sql</code> via the Supabase SQL Editor.
              </p>
            </div>
          }
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews by client name, company, or testimonial text..."
            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-[#00B3FF] bg-slate-50/50 focus:bg-white transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Rating Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <span className="text-[11px] text-slate-400 px-2 font-medium">Rating:</span>
            <button
              onClick={() => setRatingFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                ratingFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map((r) => (
              <button
                key={r}
                onClick={() => setRatingFilter(r)}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  ratingFilter === r
                    ? 'bg-white text-amber-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{r}</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                statusFilter === 'published'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                statusFilter === 'draft'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Draft
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List Table */}
      <ReviewListTable
        reviews={reviews}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onDelete={(r) => setDeletingReview(r)}
        onAdd={handleOpenAdd}
      />

      {/* Add / Edit Review Modal */}
      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveReview}
        review={editingReview}
      />

      {/* Delete Confirmation Modal */}
      <DeleteReviewModal
        isOpen={Boolean(deletingReview)}
        onClose={() => setDeletingReview(null)}
        onConfirm={handleConfirmDelete}
        review={deletingReview}
      />
    </div>
  );
}
