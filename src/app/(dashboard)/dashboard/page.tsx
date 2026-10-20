'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  FileEdit,
  PlusCircle,
  FolderTree,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentPostsList } from '@/components/dashboard/RecentPostsList';
import { Button } from '@/components/ui/Button';
import { BlogPost } from '@/types/blog';
import { getDashboardStats } from '@/lib/supabase/posts-service';

export default function DashboardPage() {
  const [totalPosts, setTotalPosts] = useState(0);
  const [publishedPosts, setPublishedPosts] = useState(0);
  const [draftPosts, setDraftPosts] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    const { data } = await getDashboardStats();
    if (data) {
      setTotalPosts(data.totalPosts);
      setPublishedPosts(data.publishedPosts);
      setDraftPosts(data.draftPosts);
      setTotalCategories(data.totalCategories);
      setRecentPosts(data.recentPosts || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    getDashboardStats().then(({ data }) => {
      if (!isMounted) return;
      if (data) {
        setTotalPosts(data.totalPosts);
        setPublishedPosts(data.publishedPosts);
        setDraftPosts(data.draftPosts);
        setTotalCategories(data.totalCategories);
        setRecentPosts(data.recentPosts || []);
      }
      setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#01153B] tracking-tight">
              Dashboard Overview
            </h1>
            <span className="text-[11px] font-bold bg-[#00B3FF]/15 text-[#0077B6] px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time analytics and management for Zoftcorp technical blogs and SEO content.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            title="Refresh statistics"
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <Link href="/dashboard/posts/new">
            <Button
              variant="orange"
              size="md"
              leftIcon={<PlusCircle className="h-4 w-4" />}
            >
              Create New Blog
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row: Total, Published, Drafts, Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Posts"
          value={isLoading ? '—' : totalPosts}
          icon={FileText}
          description="All articles in database"
          href="/dashboard/posts"
          color="navy"
        />

        <StatCard
          label="Published Posts"
          value={isLoading ? '—' : publishedPosts}
          icon={CheckCircle2}
          description="Live on Zoftcorp website"
          href="/dashboard/posts?status=published"
          color="emerald"
        />

        <StatCard
          label="Draft Posts"
          value={isLoading ? '—' : draftPosts}
          icon={FileEdit}
          description="Private work in progress"
          href="/dashboard/posts?status=draft"
          color="amber"
        />

        <StatCard
          label="Categories"
          value={isLoading ? '—' : totalCategories}
          icon={FolderTree}
          description="Taxonomy topics"
          href="/dashboard/categories"
          color="blue"
        />
      </div>

      {/* Quick Action SaaS Banner */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-[#01153B] to-[#031E4D] p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#00B3FF]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#00B3FF]">
              Blog Publishing Engine
            </span>
          </div>
          <h3 className="text-lg font-bold text-white">
            Publish technical insights for enterprise decision-makers
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Use the WYSIWYG editor to write articles with formatted code snippets, SQL queries, architecture tables, and automated Schema.org metadata.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto">
          <Link href="/dashboard/posts" className="flex-1 sm:flex-initial">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
            >
              All Posts
            </Button>
          </Link>
          <Link href="/dashboard/posts/new" className="flex-1 sm:flex-initial">
            <Button
              variant="orange"
              size="sm"
              className="w-full sm:w-auto"
              leftIcon={<PlusCircle className="h-4 w-4" />}
            >
              Create Blog
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Posts Section */}
      <RecentPostsList posts={recentPosts} isLoading={isLoading} />
    </div>
  );
}
