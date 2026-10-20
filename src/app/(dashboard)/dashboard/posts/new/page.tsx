import React from 'react';
import { Metadata } from 'next';
import { BlogEditor } from '@/components/posts/BlogEditor';
import { SupabaseConfigBanner } from '@/components/ui/SupabaseConfigBanner';

export const metadata: Metadata = {
  title: 'Create Blog Post | ZOFT Corp Admin Portal',
  description: 'Write, preview, and publish new blog posts.',
};

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <SupabaseConfigBanner />
      <BlogEditor mode="create" />
    </div>
  );
}
