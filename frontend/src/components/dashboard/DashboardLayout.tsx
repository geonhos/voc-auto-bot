import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * @description Main dashboard layout container
 */
export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className={cn('space-y-6', className)} role="main" aria-label="Dashboard">
      {children}
    </div>
  );
}

interface DashboardSectionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * @description Dashboard section wrapper for grouping related content
 */
export function DashboardSection({ children, className }: DashboardSectionProps) {
  return <section className={cn('w-full', className)}>{children}</section>;
}

interface KpiGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * @description Responsive grid layout for KPI cards
 * - 1 column on mobile
 * - 2 columns on tablet
 * - 4 columns on desktop
 */
export function KpiGrid({ children, className }: KpiGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
      role="group"
      aria-label="Key Performance Indicators"
    >
      {children}
    </div>
  );
}

interface ChartGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

/**
 * @description Responsive grid layout for charts
 * @param columns - Number of columns on desktop (default: 2)
 */
export function ChartGrid({ children, columns = 2, className }: ChartGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div
      className={cn('grid gap-6', gridClasses[columns], className)}
      role="group"
      aria-label="Charts"
    >
      {children}
    </div>
  );
}

interface DashboardCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

/**
 * @description Card wrapper for dashboard content
 */
export function DashboardCard({ children, title, className }: DashboardCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border-light bg-surface-light p-6 shadow-sm',
        'dark:border-border-dark dark:bg-surface-dark',
        className
      )}
    >
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
