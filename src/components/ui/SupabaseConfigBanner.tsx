'use client';

import React from 'react';
import { AlertTriangle, Key, ExternalLink } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export function SupabaseConfigBanner() {
  const configured = isSupabaseConfigured();

  if (configured) {
    return null;
  }

  const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50/90 p-4 shadow-xs">
      <div className="flex items-start gap-3.5">
        <div className="rounded-lg bg-amber-100 p-2 text-amber-700 shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1 text-sm text-amber-900">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-amber-950 flex items-center gap-1.5">
              <span>Supabase Backend Configuration Required</span>
              <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                Setup Needed
              </span>
            </h4>
            <span className="text-xs text-amber-700 hidden sm:inline">CMS Integration</span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-amber-800 leading-relaxed">
            Live database operations, authentication, and image uploads require valid Supabase project credentials.
            {isProduction ? (
              <> Currently, environment variables are missing or unconfigured in <code className="bg-amber-100/90 text-amber-900 px-1.5 py-0.5 rounded font-mono text-xs">Vercel Project Settings</code>.</>
            ) : (
              <> Currently, placeholder values are detected in <code className="bg-amber-100/90 text-amber-900 px-1.5 py-0.5 rounded font-mono text-xs">.env.local</code>.</>
            )}
          </p>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 rounded-md bg-white/80 p-2 border border-amber-200">
              <Key className="h-4 w-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-medium text-slate-800">NEXT_PUBLIC_SUPABASE_URL</span>
                <p className="text-[11px] text-slate-500">Your Supabase project URL</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-md bg-white/80 p-2 border border-amber-200">
              <Key className="h-4 w-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-medium text-slate-800">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                <p className="text-[11px] text-slate-500">Your Supabase public anon key</p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs text-amber-800">
            <span>
              See complete instructions in{' '}
              <strong className="font-semibold text-amber-950 font-mono">SUPABASE_SETUP.md</strong>
            </span>
            <span className="text-amber-400">•</span>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-amber-900 underline hover:text-amber-700"
            >
              Supabase Dashboard <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
