import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  loading?: boolean;
}

export default function LoadingSpinner({
  size = 'md',
  className,
  loading = true,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-[2px]',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-[3px]',
  };

  return (
    <span
      aria-label="Loading"
      role="status"
      className={clsx(
        'inline-block rounded-full border-primary-500/30 border-t-primary-500',
        loading && 'animate-spin',
        sizeClasses[size],
        className,
      )}
    />
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={clsx('skeleton', className)} />
  );
}

export function MovieCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden backdrop-blur-xl shadow-glass">
      <div className="relative aspect-[2/3]">
        <Skeleton className="absolute inset-0" />
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-5 w-8 rounded-lg" />
        </div>
        <div className="absolute bottom-3 left-3">
          <Skeleton className="h-6 w-12 rounded-lg" />
        </div>
      </div>
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4 rounded-lg" />
        <div className="flex gap-4">
          <Skeleton className="h-3.5 w-16 rounded-lg" />
          <Skeleton className="h-3.5 w-12 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-lg" />
          <Skeleton className="h-6 w-12 rounded-lg" />
        </div>
        <div className="flex gap-2.5 pt-2">
          <Skeleton className="h-9 flex-1 rounded-xl" />
          <Skeleton className="h-9 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative min-h-screen bg-dark-900 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/80 to-dark-950/30" />
      
      <div className="relative z-10 flex min-h-screen max-w-7xl items-center px-4 pb-32 pt-32 sm:px-6 lg:mx-auto lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 w-full">
          {/* Poster Skeleton */}
          <div className="hidden lg:block shrink-0">
            <Skeleton className="w-[320px] h-[480px] rounded-3xl" />
          </div>
          
          {/* Content Skeleton */}
          <div className="max-w-2xl space-y-8">
            <div className="flex gap-3">
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
            <Skeleton className="h-16 md:h-20 w-full rounded-2xl" />
            <div className="space-y-3">
              <Skeleton className="h-5 w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4 rounded-lg" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-28 rounded-xl" />
              <Skeleton className="h-10 w-24 rounded-xl" />
              <Skeleton className="h-10 w-20 rounded-xl" />
            </div>
            <div className="flex gap-4 pt-4">
              <Skeleton className="h-14 w-48 rounded-2xl" />
              <Skeleton className="h-14 w-48 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator Skeleton */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <Skeleton className="w-6 h-10 rounded-full" />
      </div>
    </div>
  );
}

export function SearchPanelSkeleton() {
  return (
    <div className="relative z-20 -mt-24 px-4 sm:px-6 lg:px-8">
      <div className="glass-panel mx-auto max-w-6xl p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-12 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden p-6 backdrop-blur-xl shadow-glass">
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-8 flex-1 rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-24 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-3 w-20 rounded-lg mt-2" />
          </div>
        ))}
      </div>
      
      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
          <Skeleton className="h-6 w-32 rounded-lg mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                  <Skeleton className="h-3 w-1/2 rounded-lg" />
                </div>
                <Skeleton className="h-6 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
          <Skeleton className="h-6 w-32 rounded-lg mb-6" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
