import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

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

export default Skeleton;