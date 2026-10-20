'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Send,
  ArrowLeft,
  RefreshCw,
  Globe,
  Share2,
  Eye,
} from 'lucide-react';
import { BlogPost, BlogFormValues, PostStatus, Category, Tag } from '@/types/blog';
import { slugify, calculateReadingTime } from '@/lib/utils';
import { createPost, updatePost } from '@/lib/supabase/posts-service';
import { getCategories, getTags, createCategory, createTag } from '@/lib/supabase/taxonomy-service';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { RichTextEditor } from '@/components/posts/RichTextEditor';
import { FeaturedImageUpload } from '@/components/posts/FeaturedImageUpload';
import { PostPreviewModal } from '@/components/posts/PostPreviewModal';
import { Alert } from '@/components/ui/Alert';

interface BlogEditorProps {
  initialPost?: BlogPost;
  mode: 'create' | 'edit';
}

export function BlogEditor({ initialPost, mode }: BlogEditorProps) {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState(initialPost?.title || '');
  const [slug, setSlug] = useState(initialPost?.slug || '');
  const [autoSlug, setAutoSlug] = useState(mode === 'create');
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || '');
  const [content, setContent] = useState(initialPost?.content || '');
  const [featuredImage, setFeaturedImage] = useState<string | null>(initialPost?.featured_image || null);
  const [category, setCategory] = useState(initialPost?.category || 'Database Administration');
  const [categorySlug, setCategorySlug] = useState(initialPost?.category_slug || 'database-administration');
  const [tags, setTags] = useState<string[]>(initialPost?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<PostStatus>(initialPost?.status || 'draft');
  const [seoTitle, setSeoTitle] = useState(initialPost?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(initialPost?.seo_description || '');
  const [ogTitle, setOgTitle] = useState(initialPost?.og_title || '');
  const [ogDescription, setOgDescription] = useState(initialPost?.og_description || '');
  const [ogImage, setOgImage] = useState(initialPost?.og_image || '');
  const [canonicalUrl, setCanonicalUrl] = useState(initialPost?.canonical_url || '');
  const [schemaType, setSchemaType] = useState<'Article' | 'BlogPosting' | 'TechArticle'>(
    initialPost?.schema_type || 'Article'
  );
  const [readingTime, setReadingTime] = useState(
    initialPost?.reading_time || (initialPost?.content ? calculateReadingTime(initialPost.content) : '3 min read')
  );
  const [authorName, setAuthorName] = useState(initialPost?.author_name || 'ZOFT Corp Engineering Team');
  const [featured, setFeatured] = useState(initialPost?.featured || false);

  // Taxonomy from DB
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [dbTags, setDbTags] = useState<Tag[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [showNewCatInput, setShowNewCatInput] = useState(false);

  // UI & Validation States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Load categories and tags
  useEffect(() => {
    async function loadTaxonomy() {
      const catRes = await getCategories();
      if (catRes.data && catRes.data.length > 0) {
        setDbCategories(catRes.data);
      }
      const tagRes = await getTags();
      if (tagRes.data) {
        setDbTags(tagRes.data);
      }
    }
    loadTaxonomy();
  }, []);

  // Auto-sync slug when title changes (if autoSlug enabled)
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug) {
      setSlug(slugify(val));
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    setCategory(selectedName);
    const found = dbCategories.find((c) => c.name === selectedName);
    setCategorySlug(found ? found.slug : slugify(selectedName));
  };

  const handleAddCategoryQuick = async () => {
    if (!newCatName.trim()) return;
    const res = await createCategory(newCatName.trim());
    if (res.data) {
      setDbCategories((prev) => [...prev, res.data!]);
      setCategory(res.data.name);
      setCategorySlug(res.data.slug);
      setNewCatName('');
      setShowNewCatInput(false);
    } else {
      alert(res.error || 'Failed to add category');
    }
  };

  // Tag Handling
  const handleAddTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      // If tag is not in dbTags, create it in DB as well
      if (!dbTags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
        createTag(trimmed);
      }
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Title is required.';
    if (!slug.trim()) errors.slug = 'URL slug is required.';
    if (!content.trim() || content === '<p></p>' || content === '<br>') {
      errors.content = 'Article content is required.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (targetStatus: PostStatus) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validate()) {
      setErrorMessage('Please fill in all required fields before saving.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    const cleanSlug = slugify(slug);

    const formValues: BlogFormValues = {
      title: title.trim(),
      slug: cleanSlug,
      excerpt: excerpt.trim(),
      content,
      featured_image: featuredImage,
      category,
      category_slug: categorySlug,
      tags,
      status: targetStatus,
      seo_title: seoTitle.trim() || title.trim(),
      seo_description: seoDescription.trim() || excerpt.trim(),
      og_title: ogTitle.trim() || seoTitle.trim() || title.trim(),
      og_description: ogDescription.trim() || seoDescription.trim() || excerpt.trim(),
      og_image: ogImage.trim() || featuredImage || '',
      canonical_url: canonicalUrl.trim() || `https://zoftcorp.com/blog-2/${cleanSlug}`,
      schema_type: schemaType,
      reading_time: readingTime,
      featured,
      author_name: authorName.trim(),
    };

    try {
      if (mode === 'create') {
        const result = await createPost(formValues);
        if (result.error) {
          setErrorMessage(result.error);
        } else {
          setSuccessMessage(
            targetStatus === 'published'
              ? 'Article published successfully!'
              : 'Draft article saved successfully!'
          );
          setTimeout(() => router.push('/dashboard/posts'), 1200);
        }
      } else if (mode === 'edit' && initialPost) {
        const result = await updatePost(initialPost.id, formValues, initialPost);
        if (result.error) {
          setErrorMessage(result.error);
        } else {
          setStatus(targetStatus);
          setSuccessMessage(
            targetStatus === 'published'
              ? 'Article updated and published!'
              : 'Article saved as draft!'
          );
          setTimeout(() => router.push('/dashboard/posts'), 1200);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save article.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Active object for preview modal
  const previewPostObject: BlogPost = {
    id: initialPost?.id || 'preview-temp-id',
    title: title || 'Untitled Blog Post',
    slug: slug || 'untitled-post',
    excerpt: excerpt,
    content: content,
    featured_image: featuredImage,
    category: category,
    category_slug: categorySlug,
    tags: tags,
    status: status,
    seo_title: seoTitle || title,
    seo_description: seoDescription || excerpt,
    og_title: ogTitle,
    og_description: ogDescription,
    og_image: ogImage,
    canonical_url: canonicalUrl,
    schema_type: schemaType,
    reading_time: readingTime,
    featured: featured,
    author_id: initialPost?.author_id || null,
    author_name: authorName,
    created_at: initialPost?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: status === 'published' ? (initialPost?.published_at || new Date().toISOString()) : null,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/posts')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            All Posts
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#01153B] tracking-tight">
              {mode === 'create' ? 'Create Blog Article' : `Edit: ${title || 'Post'}`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {mode === 'create'
                ? 'Compose a technical guide with code, diagrams, and SEO schema.'
                : 'Update article content, metadata, or publishing status.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
            leftIcon={<Eye className="h-4 w-4 text-[#0088CC]" />}
          >
            Preview
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={isSubmitting && status === 'draft'}
            onClick={() => handleSubmit('draft')}
            leftIcon={<Save className="h-4 w-4 text-slate-600" />}
          >
            Save Draft
          </Button>

          {status === 'published' && mode === 'edit' && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleSubmit('draft')}
              className="text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100"
            >
              Unpublish to Draft
            </Button>
          )}

          <Button
            type="button"
            variant="orange"
            size="sm"
            isLoading={isSubmitting && status === 'published'}
            onClick={() => handleSubmit('published')}
            leftIcon={<Send className="h-4 w-4" />}
          >
            {mode === 'edit' && initialPost?.status === 'published' ? 'Update Published' : 'Publish Article'}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <Alert
          type="error"
          title="Save Error"
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}
      {successMessage && (
        <Alert
          type="success"
          title="Success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Content & SEO */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Article Details Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-[#01153B] border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Article Details</span>
              <span className="text-xs text-slate-400 font-normal">Fields marked * are required</span>
            </h2>

            {/* Title */}
            <Input
              label="Article Title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. How ZoftCorp Eases Failover Cluster Installation with Slipstream"
              error={fieldErrors.title}
              required
            />

            {/* URL Slug & Permalinks */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-[#01153B]">
                  URL Slug <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAutoSlug(!autoSlug);
                    if (!autoSlug) setSlug(slugify(title));
                  }}
                  className="text-xs text-[#0088CC] hover:text-[#01153B] inline-flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RefreshCw className="h-3 w-3" />
                  {autoSlug ? 'Lock Slug (manual edit)' : 'Sync with Title'}
                </button>
              </div>

              <div className="flex rounded-lg border border-slate-300 bg-white shadow-2xs overflow-hidden focus-within:border-[#01153B] focus-within:ring-1 focus-within:ring-[#00B3FF]">
                <span className="inline-flex items-center px-3 text-xs text-slate-500 bg-slate-50 border-r border-slate-200 select-none font-mono">
                  https://zoftcorp.com/blog-2/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    setSlug(slugify(e.target.value));
                  }}
                  placeholder="post-url-slug"
                  className="flex-1 px-3 py-2 text-sm text-slate-900 outline-none font-mono"
                />
              </div>
              {fieldErrors.slug && (
                <p className="text-xs text-rose-600 font-semibold">{fieldErrors.slug}</p>
              )}
            </div>

            {/* Excerpt */}
            <Textarea
              label="Article Excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              placeholder="A brief 1-2 sentence executive summary displayed on blog cards..."
              helperText={`${excerpt.length} characters. Recommended: 120-160 characters.`}
            />

            {/* Full Rich Text Editor */}
            <RichTextEditor
              value={content}
              onChange={(newContent) => {
                setContent(newContent);
                setReadingTime(calculateReadingTime(newContent));
              }}
              label="Article Content"
              error={fieldErrors.content}
            />
          </div>

          {/* SEO & Search Engine Optimization Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#01153B] flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#00B3FF]" />
                  Search Engine Optimization (SEO)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Metadata consumed by Google, Bing, and web crawlers.
                </p>
              </div>
            </div>

            <Input
              label="SEO Title"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder={title || 'Leave blank to use blog title'}
              helperText={`${(seoTitle || title).length} characters. Recommended: 50–60 characters.`}
            />

            <Textarea
              label="SEO Meta Description"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={2}
              placeholder={excerpt || 'Leave blank to use article excerpt'}
              helperText={`${(seoDescription || excerpt).length} characters. Recommended: 120–160 characters.`}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Canonical URL"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder={`https://zoftcorp.com/blog-2/${slug || 'post-slug'}`}
                helperText="Defaults to the official zoftcorp.com permalink."
              />

              <Select
                label="Schema.org Structured Type"
                value={schemaType}
                onChange={(e) => setSchemaType(e.target.value as 'Article' | 'BlogPosting' | 'TechArticle')}
              >
                <option value="Article">Article (Standard)</option>
                <option value="BlogPosting">BlogPosting (Recommended)</option>
                <option value="TechArticle">TechArticle (Technical Guide)</option>
              </Select>
            </div>
          </div>

          {/* Open Graph & Social Sharing Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#01153B] flex items-center gap-2">
                <Share2 className="h-4 w-4 text-purple-600" />
                Social Media & Open Graph (OG)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize appearance when shared on LinkedIn, Twitter, Slack, and Facebook.
              </p>
            </div>

            <Input
              label="Social Share Title"
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
              placeholder={seoTitle || title || 'Title for LinkedIn / Twitter cards'}
            />

            <Textarea
              label="Social Share Description"
              value={ogDescription}
              onChange={(e) => setOgDescription(e.target.value)}
              rows={2}
              placeholder={seoDescription || excerpt || 'Summary for social previews'}
            />

            <Input
              label="Custom Social Share Image URL (Optional)"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              placeholder="Leave blank to use the featured image"
              helperText="Recommended dimension: 1200 x 630 pixels."
            />
          </div>
        </div>

        {/* Right 1 Col: Publishing, Taxonomy, Image, Author */}
        <div className="space-y-6">
          {/* Publication Status Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#01153B] border-b border-slate-100 pb-2">
              Publishing Options
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                    status === 'draft'
                      ? 'border-amber-400 bg-amber-50 text-amber-900 ring-1 ring-amber-400'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Draft (Private)
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                    status === 'published'
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-400'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Published (Live)
                </button>
              </div>
            </div>

            {/* Featured Post Checkbox */}
            <label className="flex items-start gap-2.5 pt-3 border-t border-slate-100 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#01153B] focus:ring-[#00B3FF]"
              />
              <span className="text-xs text-slate-700">
                <strong className="font-semibold text-slate-900">Featured Article</strong>
                <span className="block text-slate-400 text-[11px]">
                  Pin this article to top highlights on the main blog
                </span>
              </span>
            </label>
          </div>

          {/* Category & Taxonomy Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-[#01153B]">Category</h3>
              <button
                type="button"
                onClick={() => setShowNewCatInput(!showNewCatInput)}
                className="text-xs text-[#0088CC] hover:text-[#01153B] font-semibold cursor-pointer"
              >
                {showNewCatInput ? 'Cancel' : '+ New Category'}
              </button>
            </div>

            {showNewCatInput && (
              <div className="flex gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in duration-150">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Category Name"
                  className="flex-1 px-2.5 py-1 text-xs border rounded-md border-slate-300 bg-white"
                />
                <Button variant="primary" size="sm" onClick={handleAddCategoryQuick}>
                  Add
                </Button>
              </div>
            )}

            <Select
              value={category}
              onChange={handleCategoryChange}
            >
              {dbCategories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </Select>

            {/* Tags Section */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">Tags</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  placeholder="Add tag and press Enter..."
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#01153B]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTag(tagInput)}
                >
                  Add
                </Button>
              </div>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-rose-600 transition-colors ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Tag Suggestions from DB */}
              {dbTags.length > 0 && (
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Existing Tags:
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {dbTags
                      .filter((t) => !tags.includes(t.name))
                      .map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleAddTag(t.name)}
                          className="text-[10px] bg-slate-50 hover:bg-[#00B3FF]/10 hover:text-[#0077B6] border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 transition-colors cursor-pointer"
                        >
                          + {t.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Featured Image Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <FeaturedImageUpload
              value={featuredImage}
              onChange={setFeaturedImage}
            />
          </div>

          {/* Author & Reading Time Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#01153B] border-b border-slate-100 pb-2">
              Metadata
            </h3>

            <Input
              label="Author Name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="ZOFT Corp Engineering Team"
            />

            <Input
              label="Reading Time"
              value={readingTime}
              onChange={(e) => setReadingTime(e.target.value)}
              placeholder="3 min read"
              helperText="Auto-computed based on word count."
            />
          </div>
        </div>
      </div>

      {/* Post Preview Modal */}
      <PostPreviewModal
        post={previewPostObject}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
}
