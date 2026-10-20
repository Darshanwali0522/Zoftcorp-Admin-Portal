'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Search,
  Share2,
  Code2,
  Eye,
  Check,
  Copy,
} from 'lucide-react';
import { BlogPost } from '@/types/blog';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface PostPreviewModalProps {
  post: BlogPost | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PostPreviewModal({ post, isOpen, onClose }: PostPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'article' | 'seo' | 'social' | 'schema'>('article');
  const [copiedSchema, setCopiedSchema] = useState(false);

  if (!isOpen || !post) return null;

  // Generate standard Schema.org JSON-LD
  const canonicalUrl = post.canonical_url || `https://zoftcorp.com/blog-2/${post.slug}`;
  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': post.schema_type || 'BlogPosting',
    headline: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    image: post.featured_image || 'https://zoftcorp.com/images/default-blog.jpg',
    author: {
      '@type': 'Person',
      name: post.author_name || 'ZOFT Corp Engineering Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ZOFT Corp',
      logo: {
        '@type': 'ImageObject',
        url: 'https://zoftcorp.com/images/logo.png',
      },
    },
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };

  const schemaString = JSON.stringify(schemaJson, null, 2);

  const handleCopySchema = () => {
    navigator.clipboard.writeText(schemaString);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-[#01153B] text-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00B3FF]">
              Protected Preview
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-xs text-slate-300 truncate max-w-sm">
              {post.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={post.status} />
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-2.5 shrink-0 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('article')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'article'
                  ? 'bg-white text-[#01153B] shadow-2xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="h-3.5 w-3.5 text-[#00B3FF]" />
              Article View
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'seo'
                  ? 'bg-white text-[#01153B] shadow-2xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="h-3.5 w-3.5 text-blue-600" />
              Google SERP
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'social'
                  ? 'bg-white text-[#01153B] shadow-2xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Share2 className="h-3.5 w-3.5 text-purple-600" />
              Social Cards (OG)
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'schema'
                  ? 'bg-white text-[#01153B] shadow-2xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="h-3.5 w-3.5 text-emerald-600" />
              JSON-LD Schema
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Permalink: <code className="font-mono text-slate-600">/blog-2/{post.slug}</code>
          </span>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white">
          {/* TAB 1: Real Article Structure */}
          {activeTab === 'article' && (
            <article className="max-w-3xl mx-auto space-y-6">
              {/* Category, Date & Meta */}
              <div className="space-y-3 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-2">
                  <Badge variant="brand">{post.category || 'General'}</Badge>
                  {post.featured && (
                    <span className="text-[10px] bg-[#FF6F00]/15 text-[#FF6F00] font-bold px-2 py-0.5 rounded-full">
                      Featured Guide
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#01153B] tracking-tight leading-tight">
                  {post.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700">{post.author_name || 'Admin'}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatDate(post.published_at || post.created_at)}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{post.reading_time || '3 min read'}</span>
                  </div>
                </div>
              </div>

              {/* Featured Image */}
              {post.featured_image && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full max-h-[420px] object-cover"
                  />
                </div>
              )}

              {/* Excerpt Lead */}
              {post.excerpt && (
                <p className="text-base text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border-l-4 border-[#00B3FF]">
                  {post.excerpt}
                </p>
              )}

              {/* Article Content Rendered */}
              <div
                className="prose max-w-none pt-2"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase text-slate-400 mr-1">Tags:</span>
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          )}

          {/* TAB 2: Google SERP Preview */}
          {activeTab === 'seo' && (
            <div className="max-w-2xl mx-auto space-y-6 py-4">
              <div>
                <h3 className="text-base font-bold text-[#01153B]">Google Search Result Preview</h3>
                <p className="text-xs text-slate-500">
                  Simulates how search engines will render your page title, canonical slug, and meta description.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6 shadow-2xs font-sans">
                <div className="text-xs text-slate-600 truncate flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                    Z
                  </div>
                  <span>https://zoftcorp.com</span>
                  <span>›</span>
                  <span>blog-2</span>
                  <span>›</span>
                  <span className="text-slate-800 font-medium">{post.slug}</span>
                </div>

                <div className="text-blue-700 text-lg font-semibold hover:underline cursor-pointer mt-1">
                  {post.seo_title || post.title} | ZOFT Corp
                </div>

                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  {post.seo_description || post.excerpt || 'No meta description provided for this article.'}
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-xs text-blue-900 space-y-1">
                <p className="font-semibold">SEO Checklist:</p>
                <p>• Title Length: {(post.seo_title || post.title).length} chars (Recommended: 50–60)</p>
                <p>• Description Length: {(post.seo_description || post.excerpt || '').length} chars (Recommended: 120–160)</p>
                <p>• Canonical URL: <code className="font-mono">{canonicalUrl}</code></p>
              </div>
            </div>
          )}

          {/* TAB 3: Social / Open Graph Preview */}
          {activeTab === 'social' && (
            <div className="max-w-2xl mx-auto space-y-6 py-4">
              <div>
                <h3 className="text-base font-bold text-[#01153B]">Open Graph & Social Share Card</h3>
                <p className="text-xs text-slate-500">
                  Preview for LinkedIn, Twitter, Slack, and Facebook link cards.
                </p>
              </div>

              <div className="rounded-xl border border-slate-300 overflow-hidden shadow-md max-w-lg mx-auto bg-white">
                {/* Social Image */}
                {post.og_image || post.featured_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.og_image || post.featured_image || ''}
                    alt={post.title}
                    className="w-full h-56 object-cover"
                  />
                ) : (
                  <div className="w-full h-56 bg-[#01153B] flex items-center justify-center text-white font-bold">
                    ZOFTCORP INSIGHTS
                  </div>
                )}

                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <span className="text-[11px] font-semibold uppercase text-slate-400 block tracking-wider">
                    zoftcorp.com
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1 line-clamp-2">
                    {post.og_title || post.seo_title || post.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    {post.og_description || post.seo_description || post.excerpt}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: JSON-LD Schema.org */}
          {activeTab === 'schema' && (
            <div className="max-w-2xl mx-auto space-y-4 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#01153B]">Structured Data (Schema.org JSON-LD)</h3>
                  <p className="text-xs text-slate-500">
                    Validated schema ready for automatic embedding into the public head tag.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySchema}
                  leftIcon={copiedSchema ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                >
                  {copiedSchema ? 'Copied JSON-LD' : 'Copy Schema'}
                </Button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-[#01153B] text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800 max-h-96">
                  {schemaString}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50 shrink-0">
          <span className="text-xs text-slate-500">
            Preview is private to administrators.
          </span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
}
