'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Code,
  FileCode2,
  Link as LinkIcon,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  Eye,
  FileCode,
  Edit3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadBlogImage } from '@/lib/supabase/admin-auth';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  label = 'Article Content',
  error,
  placeholder = 'Write your technical guide or article here...',
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<'visual' | 'source' | 'preview'>('visual');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const visualEditorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUpdatingFromProps = useRef(false);

  // Sync value to contenteditable when props change and tab is visual
  useEffect(() => {
    if (activeTab === 'visual' && visualEditorRef.current) {
      if (visualEditorRef.current.innerHTML !== value) {
        isUpdatingFromProps.current = true;
        visualEditorRef.current.innerHTML = value || '';
        isUpdatingFromProps.current = false;
      }
    }
  }, [value, activeTab]);

  const handleVisualInput = useCallback(() => {
    if (isUpdatingFromProps.current) return;
    if (visualEditorRef.current) {
      let html = visualEditorRef.current.innerHTML;
      // Strip potentially harmful scripts
      html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      onChange(html);
    }
  }, [onChange]);

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (activeTab !== 'visual') return;
    document.execCommand(command, false, arg);
    if (visualEditorRef.current) {
      visualEditorRef.current.focus();
      handleVisualInput();
    }
  };

  const handleAddLink = () => {
    const url = prompt('Enter destination URL (e.g. https://zoftcorp.com/services):');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const handleInsertTable = () => {
    const rows = parseInt(prompt('Number of rows:', '3') || '3', 10);
    const cols = parseInt(prompt('Number of columns:', '3') || '3', 10);

    if (isNaN(rows) || isNaN(cols) || rows < 1 || cols < 1) return;

    let tableHtml = '<table class="w-full border-collapse border border-slate-300 my-4"><thead><tr>';
    for (let c = 1; c <= cols; c++) {
      tableHtml += `<th class="border border-slate-300 bg-slate-100 p-2 font-semibold">Header ${c}</th>`;
    }
    tableHtml += '</tr></thead><tbody>';
    for (let r = 1; r <= rows; r++) {
      tableHtml += '<tr>';
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<td class="border border-slate-300 p-2">Cell ${r}-${c}</td>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p><br></p>';

    executeCommand('insertHTML', tableHtml);
  };

  const handleInsertCodeBlock = () => {
    const code = prompt('Paste your code snippet or query:');
    if (code) {
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const preHtml = `<pre class="bg-[#01153B] text-white p-4 rounded-lg my-4 font-mono text-sm overflow-x-auto"><code>${escapedCode}</code></pre><p><br></p>`;
      executeCommand('insertHTML', preHtml);
    }
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const { url, error: uploadErr } = await uploadBlogImage(file);
    setIsUploadingImage(false);

    if (uploadErr) {
      alert(`Image upload error: ${uploadErr}`);
      return;
    }

    if (url) {
      const alt = prompt('Enter image alt text / caption:', file.name) || '';
      const imgHtml = `<figure class="my-4"><img src="${url}" alt="${alt}" class="rounded-lg max-w-full h-auto shadow-xs" /><figcaption class="text-xs text-slate-500 mt-1.5 text-center">${alt}</figcaption></figure><p><br></p>`;
      executeCommand('insertHTML', imgHtml);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const wordCount = (value || '')
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        {label && (
          <label className="block text-sm font-bold text-[#01153B]">
            {label} <span className="text-rose-500">*</span>
          </label>
        )}

        {/* View Mode Buttons */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1 transition-all cursor-pointer',
              activeTab === 'visual' ? 'bg-white text-[#01153B] shadow-2xs font-bold' : 'hover:text-slate-900'
            )}
          >
            <Edit3 className="h-3.5 w-3.5 text-[#00B3FF]" />
            Visual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('source')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1 transition-all cursor-pointer',
              activeTab === 'source' ? 'bg-white text-[#01153B] shadow-2xs font-bold' : 'hover:text-slate-900'
            )}
          >
            <FileCode className="h-3.5 w-3.5 text-purple-600" />
            HTML Source
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1 transition-all cursor-pointer',
              activeTab === 'preview' ? 'bg-white text-[#01153B] shadow-2xs font-bold' : 'hover:text-slate-900'
            )}
          >
            <Eye className="h-3.5 w-3.5 text-emerald-600" />
            Preview
          </button>
        </div>
      </div>

      <div
        className={cn(
          'rounded-xl border border-slate-300 bg-white overflow-hidden shadow-xs focus-within:border-[#01153B] focus-within:ring-1 focus-within:ring-[#00B3FF] transition-all',
          error && 'border-rose-500 focus-within:border-rose-500 focus-within:ring-rose-500'
        )}
      >
        {/* Full Rich-Text Toolbar */}
        {activeTab === 'visual' && (
          <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/90 px-3 py-2 text-slate-700">
            {/* History: Undo / Redo */}
            <button
              type="button"
              onClick={() => executeCommand('undo')}
              title="Undo (Ctrl+Z)"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('redo')}
              title="Redo (Ctrl+Y)"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            <span className="h-4 w-px bg-slate-300 mx-1" />

            {/* Typography */}
            <button
              type="button"
              onClick={() => executeCommand('formatBlock', '<h2>')}
              title="Heading 2"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('formatBlock', '<h3>')}
              title="Heading 3"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Heading3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('formatBlock', '<h4>')}
              title="Heading 4"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Heading4 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('formatBlock', '<p>')}
              title="Paragraph"
              className="rounded px-2 py-1 text-xs font-semibold hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              P
            </button>

            <span className="h-4 w-px bg-slate-300 mx-1" />

            {/* Inline Styles */}
            <button
              type="button"
              onClick={() => executeCommand('bold')}
              title="Bold (Ctrl+B)"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('italic')}
              title="Italic (Ctrl+I)"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('underline')}
              title="Underline"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Underline className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('strikeThrough')}
              title="Strikethrough"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Strikethrough className="h-4 w-4" />
            </button>

            <span className="h-4 w-px bg-slate-300 mx-1" />

            {/* Text Alignment */}
            <button
              type="button"
              onClick={() => executeCommand('justifyLeft')}
              title="Align Left"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('justifyCenter')}
              title="Align Center"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('justifyRight')}
              title="Align Right"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <AlignRight className="h-4 w-4" />
            </button>

            <span className="h-4 w-px bg-slate-300 mx-1" />

            {/* Lists & Quotes */}
            <button
              type="button"
              onClick={() => executeCommand('insertUnorderedList')}
              title="Bullet List"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('insertOrderedList')}
              title="Numbered List"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('formatBlock', '<blockquote>')}
              title="Quote"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Quote className="h-4 w-4" />
            </button>

            <span className="h-4 w-px bg-slate-300 mx-1" />

            {/* Code & Table Elements */}
            <button
              type="button"
              onClick={() => executeCommand('formatBlock', '<code>')}
              title="Inline Code"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Code className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleInsertCodeBlock}
              title="Code Snippet Block"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <FileCode2 className="h-4 w-4 text-[#0088CC]" />
            </button>
            <button
              type="button"
              onClick={handleInsertTable}
              title="Insert Table"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <TableIcon className="h-4 w-4 text-emerald-700" />
            </button>

            <span className="h-4 w-px bg-slate-300 mx-1" />

            {/* Media & Links */}
            <button
              type="button"
              onClick={handleAddLink}
              title="Insert Hyperlink"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload Inline Image"
              disabled={isUploadingImage}
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer text-blue-600"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('insertHorizontalRule')}
              title="Horizontal Divider"
              className="rounded p-1.5 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Hidden file input for inline images */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInlineImageUpload}
          className="hidden"
        />

        {/* Visual Mode */}
        {activeTab === 'visual' && (
          <div
            ref={visualEditorRef}
            contentEditable
            onInput={handleVisualInput}
            className="min-h-[350px] max-h-[650px] overflow-y-auto p-5 text-slate-900 outline-none prose max-w-none focus:outline-none"
            data-placeholder={placeholder}
          />
        )}

        {/* Source Mode */}
        {activeTab === 'source' && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={16}
            className="w-full p-5 font-mono text-xs text-slate-800 bg-slate-950/5 outline-none resize-y leading-relaxed"
            placeholder="<p>Enter HTML markup directly...</p>"
          />
        )}

        {/* Live Preview Mode */}
        {activeTab === 'preview' && (
          <div className="min-h-[350px] max-h-[650px] overflow-y-auto p-6 bg-slate-50/50">
            {value ? (
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: value }}
              />
            ) : (
              <p className="text-slate-400 italic text-sm">Nothing to preview yet. Start composing in the editor.</p>
            )}
          </div>
        )}

        {/* Editor Bottom Status Bar */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-3">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>HTML sanitized</span>
          </div>
          <span className="hidden sm:inline text-slate-400">
            Supports H2-H4, Tables, Code Blocks, Blockquotes, Images
          </span>
        </div>
      </div>

      {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
    </div>
  );
}
