'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingInputProps {
  value: number; // 1 to 5
  onChange: (rating: number) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function StarRatingInput({
  value,
  onChange,
  label = 'Rating *',
  error,
  disabled = false,
}: StarRatingInputProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : value;

  const handleKeyDown = (e: React.KeyboardEvent, starIndex: number) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(starIndex);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(5, value + 1);
      onChange(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = Math.max(1, value - 1);
      onChange(prev);
    } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
      e.preventDefault();
      onChange(parseInt(e.key, 10));
    }
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 1:
        return '1 star — Poor';
      case 2:
        return '2 stars — Fair';
      case 3:
        return '3 stars — Good';
      case 4:
        return '4 stars — Very Good';
      case 5:
        return '5 stars — Excellent';
      default:
        return 'Select a rating (1 to 5 stars)';
    }
  };

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          {displayRating > 0 ? getRatingLabel(displayRating) : 'Required (1-5)'}
        </span>
      </div>

      <div
        className="flex items-center gap-1.5 py-1"
        role="radiogroup"
        aria-label="Star rating from 1 to 5"
        onMouseLeave={() => setHoverRating(null)}
      >
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = starIndex <= displayRating;

          return (
            <button
              key={starIndex}
              type="button"
              role="radio"
              aria-checked={value === starIndex}
              aria-label={`${starIndex} star${starIndex > 1 ? 's' : ''}`}
              disabled={disabled}
              onClick={() => onChange(starIndex)}
              onMouseEnter={() => setHoverRating(starIndex)}
              onKeyDown={(e) => handleKeyDown(e, starIndex)}
              className={cn(
                'p-1.5 rounded-lg transition-transform focus:outline-none focus:ring-2 focus:ring-[#00B3FF] focus:ring-offset-1 cursor-pointer select-none',
                !disabled && 'hover:scale-110 active:scale-95'
              )}
            >
              <Star
                className={cn(
                  'h-6 w-6 transition-colors',
                  isFilled
                    ? 'fill-amber-400 text-amber-500 stroke-amber-500'
                    : 'fill-transparent text-slate-300 stroke-slate-300'
                )}
              />
            </button>
          );
        })}

        <span className="ml-2 text-xs font-bold text-slate-700">
          {value > 0 ? `${value} / 5` : '0 / 5'}
        </span>
      </div>

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      <p className="text-[11px] text-slate-400">
        Click or use arrow keys (1–5) to select the client evaluation score.
      </p>
    </div>
  );
}
