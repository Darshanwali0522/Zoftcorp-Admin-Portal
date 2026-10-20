import React from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail = 'admin@zoftcorp.com';

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      userEmail = user.email;
    }
  } catch {
    // Fallback if supabase client can't connect yet
  }

  return <DashboardShell userEmail={userEmail}>{children}</DashboardShell>;
}
