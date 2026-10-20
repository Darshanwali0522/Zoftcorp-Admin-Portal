'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  PlusCircle,
  Shield,
  LogOut,
  ChevronDown,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { signOutAdmin } from '@/lib/supabase/admin-auth';

interface TopbarProps {
  userEmail?: string;
  onMenuToggle?: () => void;
}

export function Topbar({ userEmail = 'admin@zoftcorp.com', onMenuToggle }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOutAdmin();
    router.push('/login');
    router.refresh();
  };

  // Generate breadcrumbs from pathname
  const getBreadcrumbs = () => {
    if (pathname === '/dashboard') return [{ label: 'Dashboard', href: '/dashboard' }];
    if (pathname === '/dashboard/posts') {
      return [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'All Posts', href: '/dashboard/posts' },
      ];
    }
    if (pathname === '/dashboard/posts/new') {
      return [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Posts', href: '/dashboard/posts' },
        { label: 'Create Blog', href: '/dashboard/posts/new' },
      ];
    }
    if (pathname.includes('/edit')) {
      return [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Posts', href: '/dashboard/posts' },
        { label: 'Edit Post', href: pathname },
      ];
    }
    if (pathname === '/dashboard/categories') {
      return [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Categories', href: '/dashboard/categories' },
      ];
    }
    if (pathname === '/dashboard/tags') {
      return [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Tags', href: '/dashboard/tags' },
      ];
    }
    return [{ label: 'Dashboard', href: '/dashboard' }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.href + idx}>
                {idx > 0 && <span className="text-slate-400">/</span>}
                {isLast ? (
                  <span className="text-slate-900 font-semibold">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-slate-500 hover:text-[#01153B] transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right: Actions & Admin Profile */}
      <div className="flex items-center gap-3">
        {/* Create Blog Button (hidden on new post page) */}
        {pathname !== '/dashboard/posts/new' && (
          <Link href="/dashboard/posts/new">
            <Button
              variant="orange"
              size="sm"
              leftIcon={<PlusCircle className="h-4 w-4" />}
            >
              Create Blog
            </Button>
          </Link>
        )}

        {/* Admin Account Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="h-7 w-7 rounded-full bg-[#01153B] text-[#00B3FF] flex items-center justify-center font-bold text-xs shadow-2xs">
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="text-left hidden md:block">
              <span className="block text-xs font-semibold text-slate-900 max-w-[140px] truncate leading-tight">
                {userEmail}
              </span>
              <span className="block text-[10px] text-slate-500 font-medium">Administrator</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
                <p className="text-xs font-bold text-slate-900">Signed in as</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{userEmail}</p>
              </div>

              <div className="py-1">
                <Link
                  href="/dashboard/posts"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Shield className="h-4 w-4 text-slate-400" />
                  Manage Articles
                </Link>
                <Link
                  href="/dashboard/categories"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  Categories & Tags
                </Link>
              </div>

              <div className="border-t border-slate-100 py-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="h-4 w-4 text-rose-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
