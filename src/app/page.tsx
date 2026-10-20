import { redirect } from 'next/navigation';

export default function RootPage() {
  // Direct default entry point to the dashboard (protected by middleware)
  redirect('/dashboard');
}
