import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { PostListTable } from '@/components/posts/PostListTable';
import { Button } from '@/components/ui/Button';
import { SupabaseConfigBanner } from '@/components/ui/SupabaseConfigBanner';

export const metadata: Metadata = {
  title: 'Manage Blog Posts | ZOFT Corp Admin Portal',
  description: 'View, filter, edit, and manage all published and draft articles.',
};

export default function PostsPage() {
  return (
    <div className="space-y-6">
      <SupabaseConfigBanner />

      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            All Blog Posts
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your entire catalog of published blogs and draft revisions.
          </p>
        </div>

        <Link href="/dashboard/posts/new">
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="h-4 w-4" />}
          >
            Create New Blog
          </Button>
        </Link>
      </div>

      {/* Interactive Table with search, category/status filters & delete confirmation */}
      <PostListTable />
    </div>
  );
}
