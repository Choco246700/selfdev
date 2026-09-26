import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-gray-200/70 rounded-lg ${className}`}
    aria-hidden="true"
  />
);

/** Full-dashboard skeleton matching the real layout. */
export const DashboardSkeleton: React.FC = () => (
  <div className="flex flex-col gap-6">
    {/* Greeting */}
    <div className="flex flex-col gap-2">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="h-4 w-72" />
    </div>

    {/* Main grid */}
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:min-h-152.5">
      {/* Left card */}
      <Skeleton className="h-full min-h-152.5 rounded-2xl" />

      {/* Right column */}
      <div className="flex flex-col gap-6">
        {/* Skill cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        {/* Today's Todo */}
        <Skeleton className="flex-1 min-h-95 rounded-2xl" />
      </div>
    </div>

    {/* Practice activity */}
    <Skeleton className="h-56 rounded-2xl" />

    {/* Recent sessions */}
    <Skeleton className="h-64 rounded-2xl" />
  </div>
);