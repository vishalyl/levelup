import { redirect } from 'next/navigation';

// The dashboard layout at app/(dashboard)/page.tsx handles the root route.
// This file should not be needed but is kept as a safety redirect.
export default function RootPage() {
  redirect('/');
}
