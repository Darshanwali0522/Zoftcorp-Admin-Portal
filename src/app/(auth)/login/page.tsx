import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';
import { SupabaseConfigBanner } from '@/components/ui/SupabaseConfigBanner';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Sign In | ZOFT Corp Admin Portal',
  description: 'Sign in to access the Zoftcorp Blog Administration Portal.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4 relative overflow-hidden">
      {/* Subtle brand background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-br from-[#00B3FF]/8 via-[#01153B]/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <SupabaseConfigBanner />
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#00B3FF]" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>

      <div className="mt-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <span>&copy; {new Date().getFullYear()} ZOFT Corp.</span>
        <span>•</span>
        <span>Enterprise Blog CMS</span>
        <span>•</span>
        <span>v2.0 Production</span>
      </div>
    </div>
  );
}
