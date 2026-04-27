'use client';

import Providers, { useApp } from '@/components/Providers';
import Sidebar from '@/components/Sidebar';
import DashboardPage from './(dashboard)/page';

function DashboardRoot() {
  const { progress } = useApp();
  return (
    <div className="min-h-screen bg-dot-pattern">
      <Sidebar xpProgress={progress} />
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <DashboardPage />
        </div>
      </main>
    </div>
  );
}

export default function RootPage() {
  return (
    <Providers>
      <DashboardRoot />
    </Providers>
  );
}
