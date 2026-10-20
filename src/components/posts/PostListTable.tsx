'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  FileText,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import { BlogPost, PostStatus, Category } from '@/types/blog';
import { getPosts, deletePost, togglePostStatus } from '@/lib/supabase/posts-service';
import { getCategories } from '@/lib/supabase/taxonomy-service';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { DeleteConfirmModal } from '@/components/posts/DeleteConfirmModal';
import { PostPreviewModal } from '@/components/posts/PostPreviewModal';
import { Alert } from '@/components/ui/Alert';

export function PostListTable() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated_at' | 'created_at' | 'title'>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);

  // Modals & Action States
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [postToPreview, setPostToPreview] = useState<BlogPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  // Load categories for filter
  useEffect(() => {
    async function loadCats() {
      const res = await getCategories();
      if (res.data) setCategories(res.data);
    }
    loadCats();
  }, []);

  const fetchPostList = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, count, error } = await getPosts({
      search: searchQuery,
      status: statusFilter,
      category: categoryFilter,
      sortBy: sortBy,
      sortOrder: sortOrder,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    });

    if (error) {
      setError(error);
    } else {
      setPosts(data || []);
      setTotalCount(count || 0);
    }
    setIsLoading(false);
  }, [searchQuery, statusFilter, categoryFilter, sortBy, sortOrder, currentPage, pageSize]);

  useEffect(() => {
    let isCancelled = false;
    getPosts({
      search: searchQuery,
      status: statusFilter,
      category: categoryFilter,
      sortBy: sortBy,
      sortOrder: sortOrder,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    }).then(({ data, count, error }) => {
      if (isCancelled) return;
      if (error) {
        setError(error);
      } else {
        setPosts(data || []);
        setTotalCount(count || 0);
      }
      setIsLoading(false);
    });
    return () => {
      isCancelled = true;
    };
  }, [searchQuery, statusFilter, categoryFilter, sortBy, sortOrder, currentPage, pageSize]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPostList();
  };

  const handleToggleStatus = async (post: BlogPost) => {
    const nextStatus: PostStatus = post.status === 'published' ? 'draft' : 'published';
    setStatusUpdatingId(post.id);

    const res = await togglePostStatus(post.id, nextStatus);
    setStatusUpdatingId(null);

    if (res.success) {
      setActionSuccess(
        nextStatus === 'published'
          ? `Published "${post.title}" successfully!`
          : `Returned "${post.title}" to Draft status.`
      );
      fetchPostList();
      setTimeout(() => setActionSuccess(null), 3500);
    } else {
      setError(res.error || 'Failed to update publication status.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);

    const { success, error } = await deletePost(postToDelete.id);
    setIsDeleting(false);

    if (success) {
      setActionSuccess(`Deleted "${postToDelete.title}" successfully.`);
      setPostToDelete(null);
      fetchPostList();
      setTimeout(() => setActionSuccess(null), 4000);
    } else {
      setError(error || 'Failed to delete post.');
      setPostToDelete(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-4">
      {/* Notifications */}
      {actionSuccess && (
        <Alert
          type="success"
          message={actionSuccess}
          onClose={() => setActionSuccess(null)}
        />
      )}
      {error && (
        <Alert
          type="error"
          title="Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Control Bar: Search, Filters, Sorting */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by title, slug, or excerpt..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50/50 pl-9 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#01153B] focus:outline-none focus:ring-1 focus:ring-[#00B3FF] transition-colors"
          />
        </form>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-bold hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as PostStatus | 'all');
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-[#01153B] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-bold hidden sm:inline">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-[#01153B] focus:outline-none max-w-[150px] truncate"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-bold hidden sm:inline">Sort:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb as 'updated_at' | 'created_at' | 'title');
                setSortOrder(so as 'asc' | 'desc');
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-[#01153B] focus:outline-none"
            >
              <option value="updated_at-desc">Recently Updated</option>
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="title-asc">Title (A-Z)</option>
            </select>
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={fetchPostList}
            title="Refresh List"
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Posts Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="px-5 py-3.5">Post</th>
                <th className="px-4 py-3.5">Category & Tags</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Author</th>
                <th className="px-4 py-3.5">Last Updated</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <div className="h-10 w-10 bg-slate-200 rounded" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-4 w-3/4 bg-slate-200 rounded" />
                          <div className="h-3 w-1/2 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-5 w-24 bg-slate-200 rounded-full" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-5 w-16 bg-slate-200 rounded-full" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-20 bg-slate-200 rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 bg-slate-200 rounded" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-7 w-20 bg-slate-200 rounded inline-block" />
                    </td>
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="rounded-full bg-slate-100 p-3.5 mb-3 text-slate-400">
                        <FileText className="h-7 w-7" />
                      </div>
                      <h4 className="text-base font-bold text-[#01153B]">No articles found</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                          ? 'Try adjusting your search criteria or resetting filters.'
                          : 'Begin building your catalog by creating your first article.'}
                      </p>
                      <Link href="/dashboard/posts/new" className="mt-4">
                        <Button variant="orange" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                          Create New Blog
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Thumbnail + Title + Slug */}
                    <td className="px-5 py-4 max-w-md">
                      <div className="flex items-start gap-3">
                        {post.featured_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="h-10 w-10 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs mt-0.5"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/dashboard/posts/${post.id}/edit`}
                            className="font-bold text-[#01153B] hover:text-[#0088CC] transition-colors line-clamp-1 block leading-snug"
                          >
                            {post.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span className="font-mono text-[11px] text-slate-400 truncate max-w-[220px]">
                              /{post.slug}
                            </span>
                            {post.featured && (
                              <span className="rounded bg-[#00B3FF]/15 px-1.5 py-0.2 text-[10px] font-bold text-[#0077B6]">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category & Tags */}
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <Badge variant="default" size="sm">
                          {post.category || 'General'}
                        </Badge>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {post.tags.slice(0, 2).map((t) => (
                              <span
                                key={t}
                                className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium truncate max-w-[80px]"
                              >
                                #{t}
                              </span>
                            ))}
                            {post.tags.length > 2 && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                +{post.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status with Quick Toggle */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={post.status} />
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(post)}
                          disabled={statusUpdatingId === post.id}
                          title={post.status === 'published' ? 'Switch to Draft' : 'Publish live'}
                          className="text-[11px] text-slate-400 hover:text-[#01153B] underline transition-colors cursor-pointer"
                        >
                          {statusUpdatingId === post.id
                            ? '...'
                            : post.status === 'published'
                            ? 'Unpublish'
                            : 'Publish'}
                        </button>
                      </div>
                    </td>

                    {/* Author */}
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                      {post.author_name || 'Admin'}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDate(post.updated_at)}</span>
                      </div>
                      {post.published_at && post.status === 'published' && (
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Published {formatDate(post.published_at)}
                        </span>
                      )}
                    </td>

                    {/* Actions Menu */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Preview Action */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPostToPreview(post)}
                          className="h-8 px-2.5 text-slate-600 hover:text-[#0088CC] hover:bg-sky-50"
                          title="Preview Article"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="sr-only">Preview</span>
                        </Button>

                        {/* Edit Action */}
                        <Link href={`/dashboard/posts/${post.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-slate-600 hover:text-[#01153B] hover:bg-slate-100"
                            title="Edit Post"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </Link>

                        {/* Delete Action */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPostToDelete(post)}
                          className="h-8 px-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Post"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Results Summary Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3 gap-3 text-xs text-slate-600 font-medium">
          <div>
            Showing <strong className="text-slate-900">{posts.length}</strong> of{' '}
            <strong className="text-slate-900">{totalCount}</strong> total articles
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
            >
              Previous
            </Button>
            <span className="px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        post={postToDelete}
        isOpen={Boolean(postToDelete)}
        isDeleting={isDeleting}
        onClose={() => setPostToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Post Preview Modal */}
      <PostPreviewModal
        post={postToPreview}
        isOpen={Boolean(postToPreview)}
        onClose={() => setPostToPreview(null)}
      />
    </div>
  );
}
