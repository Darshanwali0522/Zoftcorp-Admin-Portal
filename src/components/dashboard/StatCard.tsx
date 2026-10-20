import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  href?: string;
  color?: 'navy' | 'blue' | 'orange' | 'emerald' | 'amber';
}

export function StatCard({
  label,
  value,
  icon: Icon,
  description,
  href,
  color = 'navy',
}: StatCardProps) {
  const colorStyles = {
    navy: {
      iconBg: 'bg-[#01153B]/5 text-[#01153B] border-[#01153B]/10',
      badge: 'text-[#01153B]',
      glow: 'hover:border-[#01153B]/40',
    },
    blue: {
      iconBg: 'bg-[#00B3FF]/10 text-[#0088CC] border-[#00B3FF]/20',
      badge: 'text-[#0088CC]',
      glow: 'hover:border-[#00B3FF]/50',
    },
    orange: {
      iconBg: 'bg-[#FF6F00]/10 text-[#FF6F00] border-[#FF6F00]/20',
      badge: 'text-[#FF6F00]',
      glow: 'hover:border-[#FF6F00]/50',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badge: 'text-emerald-700',
      glow: 'hover:border-emerald-300',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      badge: 'text-amber-700',
      glow: 'hover:border-amber-300',
    },
  };

  const current = colorStyles[color];

  const content = (
    <div
      className={cn(
        'group rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md relative overflow-hidden',
        current.glow,
        href && 'cursor-pointer'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <div className={cn('rounded-lg p-2.5 border transition-transform group-hover:scale-105', current.iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-3xl font-extrabold tracking-tight text-[#01153B]">
          {value}
        </span>
        {href && (
          <span className="text-slate-400 group-hover:text-[#00B3FF] transition-colors">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        )}
      </div>

      {description && (
        <p className="mt-1 text-xs text-slate-500 font-medium">{description}</p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
