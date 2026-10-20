import React from 'react';
import { cn } from '@/lib/utils';
import { PostStatus } from '@/types/blog';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger' | 'draft' | 'published' | 'brand' | 'navy';
  size?: 'xs' | 'sm' | 'md';
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    info: 'bg-sky-50 text-sky-800 border-sky-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200',
    published: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
    draft: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
    brand: 'bg-[#00B3FF]/10 text-[#0077B6] border-[#00B3FF]/30 font-semibold',
    navy: 'bg-[#01153B] text-white border-[#031E4D] font-medium',
  };

  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.2',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border transition-colors select-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {variant === 'published' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {variant === 'draft' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: PostStatus }) {
  if (status === 'published') {
    return <Badge variant="published">Published</Badge>;
  }
  return <Badge variant="draft">Draft</Badge>;
}
