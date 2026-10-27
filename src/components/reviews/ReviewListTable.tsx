'use client';

import React from 'react';
import { Edit2, Trash2, Star, MessageSquareQuote, Building, User } from 'lucide-react';
import { ClientReview } from '@/types/reviews';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ReviewListTableProps {
  reviews: ClientReview[];
  isLoading: boolean;
  onEdit: (review: ClientReview) => void;
  onDelete: (review: ClientReview) => void;
  onAdd: () => void;
}

export function ReviewListTable({
  reviews,
  isLoading,
  onEdit,
  onDelete,
  onAdd,
}: ReviewListTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#00B3FF]" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading client reviews...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
          <MessageSquareQuote className="h-7 w-7 text-[#01153B]/60" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No client reviews yet</h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Add real client testimonials, star ratings, and project evaluations to prepare for website publishing.
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="orange" size="sm" onClick={onAdd}>
            Add First Review
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-6 py-3.5">
                Client / Company
              </th>
              <th scope="col" className="px-6 py-3.5">
                Star Rating
              </th>
              <th scope="col" className="px-6 py-3.5">
                Review / Testimonial
              </th>
              <th scope="col" className="px-6 py-3.5">
                Status
              </th>
              <th scope="col" className="px-6 py-3.5 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reviews.map((review) => (
              <tr
                key={review.id}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* Client & Company */}
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#01153B]/10 text-[#01153B] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {review.client_name ? review.client_name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 group-hover:text-[#01153B] transition-colors block">
                        {review.client_name}
                      </span>
                      {review.company_name ? (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="h-3 w-3 text-slate-400" />
                          {review.company_name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Independent Client</span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Rating */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5" title={`${review.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? 'fill-amber-400 text-amber-500'
                              : 'fill-transparent text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80">
                      {review.rating}.0
                    </span>
                  </div>
                </td>

                {/* Review Text */}
                <td className="px-6 py-4">
                  <p className="text-xs text-slate-700 italic max-w-md line-clamp-3 leading-relaxed">
                    &ldquo;{review.review_text}&rdquo;
                  </p>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  {review.status === 'published' ? (
                    <Badge variant="published" size="xs">
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="draft" size="xs">
                      Draft
                    </Badge>
                  )}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(review)}
                      className="p-1.5 text-slate-500 hover:text-[#01153B] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit review"
                      aria-label={`Edit review from ${review.client_name}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(review)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete review"
                      aria-label={`Delete review from ${review.client_name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
