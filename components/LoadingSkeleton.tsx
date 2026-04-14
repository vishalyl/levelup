'use client';

export function CardSkeleton() {
  return (
    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 animate-pulse">
      <div className="h-4 bg-[#1E1E2E] rounded w-1/3 mb-4" />
      <div className="h-3 bg-[#1E1E2E] rounded w-full mb-2" />
      <div className="h-3 bg-[#1E1E2E] rounded w-2/3" />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 animate-pulse flex items-center gap-4">
          <div className="w-10 h-10 bg-[#1E1E2E] rounded-xl" />
          <div className="flex-1">
            <div className="h-4 bg-[#1E1E2E] rounded w-1/3 mb-2" />
            <div className="h-3 bg-[#1E1E2E] rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-[#1E1E2E] rounded w-1/4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
