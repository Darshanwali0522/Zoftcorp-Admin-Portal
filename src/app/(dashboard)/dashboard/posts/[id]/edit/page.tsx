'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BlogPost } from '@/types/blog';
import { getPostById } from '@/lib/supabase/posts-service';
import { BlogEditor } from '@/components/posts/BlogEditor';
import { SupabaseConfigBanner } from '@/components/ui/SupabaseConfigBanner';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function loadPost() {
      setIsLoading(true);
      setError(null);
      const { data, error } = await getPostById(id);
      if (error) {
        setError(error);
      } else if (data) {
        setPost(data);
      } else {
        setError('Blog post not found.');
      }
      setIsLoading(false);
    }

    loadPost();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
        <p className="text-sm text-slate-500">Loading blog post details...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="rounded-full bg-rose-100 p-3 text-rose-600 inline-flex">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Post Not Found</h2>
        <p className="text-sm text-slate-500">{error || 'The requested blog post does not exist or has been removed.'}</p>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/posts')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to All Posts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SupabaseConfigBanner />
      <BlogEditor initialPost={post} mode="edit" />
    </div>
  );
}
