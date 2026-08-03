import { cn } from '@/lib/utils';

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('rounded-lg bg-[var(--muted)] animate-shimmer relative overflow-hidden', className)}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="surface rounded-2xl p-6 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}
