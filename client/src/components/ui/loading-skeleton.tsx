import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse rounded-md bg-muted/50",
          className
        )}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

// Table row skeleton for customer table
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
  <tr className="border-b">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="p-4">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

// KPI Card skeleton
export const KpiCardSkeleton: React.FC = () => (
  <div className="rounded-lg border bg-card p-6 shadow-sm">
    <div className="flex items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-4" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  </div>
);

// Customer row skeleton
export const CustomerRowSkeleton: React.FC = () => (
  <tr className="border-b hover:bg-muted/50">
    <td className="p-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
    </td>
    <td className="p-4">
      <Skeleton className="h-4 w-8" />
    </td>
    <td className="p-4">
      <Skeleton className="h-4 w-20" />
    </td>
    <td className="p-4">
      <Skeleton className="h-4 w-24" />
    </td>
    <td className="p-4">
      <Skeleton className="h-8 w-8 rounded" />
    </td>
  </tr>
);

// Chart skeleton for loading states
export const ChartSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
      <Skeleton className="h-4 w-3/6" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  </div>
);

// Table skeleton for loading states
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 4 }) => (
  <div className="space-y-3">
    {/* Table header skeleton */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-20" />
      ))}
    </div>
    {/* Table rows skeleton */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-4 w-16" />
        ))}
      </div>
    ))}
  </div>
);

// Quick action skeleton for loading states
export const QuickActionSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Alias for backwards compatibility
export const CardSkeleton = KpiCardSkeleton;

export default Skeleton;