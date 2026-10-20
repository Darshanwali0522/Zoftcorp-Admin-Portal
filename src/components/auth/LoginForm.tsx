'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Shield } from 'lucide-react';
import { signInAdmin } from '@/lib/supabase/admin-auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const queryError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    queryError === 'unauthorized'
      ? 'Access denied: Your account is not authorized as an administrator.'
      : null
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isConfigured = isSupabaseConfigured();

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isConfigured) {
      setErrorMessage(
        'Supabase backend credentials are not yet configured in .env.local. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable live authentication.'
      );
      return;
    }

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signInAdmin(email.trim(), password);

      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
        setIsLoading(false);
        return;
      }

      // Successful sign in and admin authorization verified
      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during sign-in.';
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 sm:p-9 shadow-xl shadow-slate-900/5">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-xl bg-[#01153B] flex items-center justify-center text-[#00B3FF] shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xl font-bold tracking-tight text-[#01153B]">
            <span>ZOFT</span>
            <span className="text-[#FF6F00]">CORP</span>
            <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-[#01153B]/5 text-[#031E4D] ml-1">
              Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Sign in to manage blog posts, technical articles, and SEO metadata.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5">
            <Alert
              type="error"
              message={errorMessage}
              onClose={() => setErrorMessage(null)}
            />
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Administrator Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@zoftcorp.com"
            autoComplete="email"
            error={fieldErrors.email}
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            autoComplete="current-password"
            error={fieldErrors.password}
            required
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="orange"
              size="lg"
              className="w-full text-base font-semibold shadow-md shadow-orange-600/20 hover:shadow-lg hover:shadow-orange-600/30 transition-all"
              isLoading={isLoading}
              leftIcon={<Lock className="h-4 w-4" />}
            >
              Sign In to Portal
            </Button>
          </div>
        </form>

        {/* Security & Access Restriction Notice */}
        <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700">
            <Lock className="h-3.5 w-3.5 text-[#FF6F00]" />
            <span>Restricted Access Control</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Only pre-authorized administrative credentials with superadmin or editor roles are permitted. Public registration is permanently disabled.
          </p>
        </div>
      </div>
    </div>
  );
}
