'use client';

import Sidebar from '@/components/Sidebar';
import Providers, { useApp } from '@/components/Providers';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { progress } = useApp();

  return (
    <div className="min-h-screen bg-dot-pattern">
      <Sidebar xpProgress={progress} />
      <main className="md:ml-64 min-h-screen pb-24 md:pb-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <DashboardContent>{children}</DashboardContent>
    </Providers>
  );
}
