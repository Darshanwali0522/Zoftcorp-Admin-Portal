'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  FolderTree,
  Tags,
  LogOut,
  ChevronRight,
  X,
} from 'lucide-react';
import { signOutAdmin } from '@/lib/supabase/admin-auth';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userEmail?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ userEmail, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOutAdmin();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    {
      label: 'All Posts',
      href: '/dashboard/posts',
      icon: FileText,
      active: pathname === '/dashboard/posts' || (pathname.startsWith('/dashboard/posts/') && !pathname.includes('/new')),
    },
    {
      label: 'Create Blog',
      href: '/dashboard/posts/new',
      icon: PlusCircle,
      active: pathname === '/dashboard/posts/new',
      highlight: true,
    },
    {
      label: 'Categories',
      href: '/dashboard/categories',
      icon: FolderTree,
      active: pathname === '/dashboard/categories',
    },
    {
      label: 'Tags',
      href: '/dashboard/tags',
      icon: Tags,
      active: pathname === '/dashboard/tags',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-[#01153B] text-slate-300 flex flex-col shrink-0 border-r border-[#031E4D] shadow-xl transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#031E4D]/80 bg-[#01153B]">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-lg bg-[#00B3FF] flex items-center justify-center text-[#01153B] font-bold shadow-md shadow-[#00B3FF]/20 group-hover:scale-105 transition-transform">
              <span className="text-base tracking-tighter">Z</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white tracking-wider text-sm">ZOFTCORP</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#00B3FF]" />
              </div>
              <span className="block text-[10px] text-slate-400 font-medium tracking-widest uppercase">
                Admin Portal
              </span>
            </div>
          </Link>

          {/* Close button on mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#031E4D] transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Content Management
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer relative',
                  isActive
                    ? 'bg-[#031E4D] text-[#00B3FF] shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-[#031E4D]/60'
                )}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#00B3FF] rounded-r-md" />
                )}

                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-[#00B3FF]' : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.highlight && !isActive && (
                  <span className="text-[10px] bg-[#FF6F00] text-white px-2 py-0.5 rounded-full font-bold">
                    New
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="h-3.5 w-3.5 text-[#00B3FF]/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: Admin Account & Sign Out */}
        <div className="p-3 border-t border-[#031E4D] bg-[#01153B]/95">
          <div className="px-3 py-2.5 rounded-lg bg-[#031E4D]/50 border border-[#031E4D]">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-[#00B3FF]/20 text-[#00B3FF] flex items-center justify-center font-bold text-xs">
                {userEmail ? userEmail.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 font-medium">Administrator</p>
                <p className="text-xs font-semibold text-white truncate" title={userEmail || 'Admin'}>
                  {userEmail || 'admin@zoftcorp.com'}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-950/50 border border-transparent hover:border-rose-800/40 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
