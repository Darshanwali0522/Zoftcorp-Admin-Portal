'use client';

import React from 'react';
import Link from 'next/link';
import { BlogPost } from '@/types/blog';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Edit3, ArrowRight, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface RecentPostsListProps {
  posts: BlogPost[];
  isLoading?: boolean;
}

export function RecentPostsList({ posts, isLoading }: RecentPostsListProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="space-y-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="text-base font-bold text-[#01153B]">Recent Articles</h3>
          <p className="text-xs text-slate-500 mt-0.5">Latest published guides and drafts in progress</p>
        </div>
        <Link
          href="/dashboard/posts"
          className="text-xs font-semibold text-[#0088CC] hover:text-[#01153B] inline-flex items-center gap-1 cursor-pointer transition-colors"
        >
          View all posts <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="p-10 text-center">
          <div className="rounded-full bg-slate-100 p-3 mb-3 text-slate-400 inline-flex">
            <FileText className="h-7 w-7" />
          </div>
          <h4 className="text-base font-bold text-[#01153B]">No posts published yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Get started by creating your first technical guide or blog article.
          </p>
          <div className="mt-4">
            <Link href="/dashboard/posts/new">
              <Button variant="orange" size="sm">
                Create First Blog
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-4 sm:px-6 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4 group"
            >
              {/* Thumbnail + Details */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {post.featured_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="h-12 w-12 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center shrink-0">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/posts/${post.id}/edit`}
                      className="text-sm font-semibold text-[#01153B] group-hover:text-[#0088CC] transition-colors truncate block"
                    >
                      {post.title}
                    </Link>
                    {post.featured && (
                      <span className="shrink-0 text-[10px] bg-[#00B3FF]/15 text-[#0077B6] font-bold px-1.5 py-0.2 rounded">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-slate-500">
                    <Badge variant="default" size="sm">
                      {post.category || 'General'}
                    </Badge>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-slate-400 truncate max-w-[180px]">
                      /{post.slug}
                    </span>
                    <span>•</span>
                    <span>Updated {formatDate(post.updated_at)}</span>
                  </div>
                </div>
              </div>

              {/* Status & Edit Button */}
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={post.status} />
                <Link href={`/dashboard/posts/${post.id}/edit`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-slate-600 hover:text-[#01153B]"
                    title="Edit Post"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
