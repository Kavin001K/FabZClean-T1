import { Link, useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { CalendarDays, PanelLeftClose, PanelLeftOpen, RefreshCw, Keyboard, Menu } from 'lucide-react';
import { useShortcuts } from '@/components/shortcuts-provider';
import { NotificationCenter } from '@/components/notification-center';
import { GlobalSearch } from '@/components/global-search';
import { UserMenu } from '@/components/layout/user-menu';
import { ThemeToggle } from '@/components/layout/theme-toggle';

const isLikelyRecordId = (segment: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
  /^[A-Za-z0-9_-]{20,}$/.test(segment);

const capitalize = (s: string) => {
  if (s === 'employee-dashboard') return 'Employee Dashboard';
  if (s === 'create-order') return 'New Order';
  if (s === 'print-queue') return 'Print Tags';
  if (s === 'wallet-management') return 'Wallet Management';
  if (s === 'user-management') return 'User Management';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarVisible: boolean;
  isMobile?: boolean;
}

export function Header({ onToggleSidebar, isSidebarVisible, isMobile = false }: HeaderProps) {
  const [location] = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState([{ label: 'Dashboard', href: '/dashboard' }]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { showShortcuts } = useShortcuts();
  const currentPage = breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard';
  const todayLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  useEffect(() => {
    const pathSegments = location.split('/').filter(p => p);
    if (pathSegments.length === 0) {
      setBreadcrumbs([{ label: 'Dashboard', href: '/dashboard' }]);
    } else {
      const mapped = pathSegments.map((segment, index) => {
        const previousSegment = pathSegments[index - 1];
        let label = capitalize(segment);

        if (isLikelyRecordId(segment)) {
          if (previousSegment === 'orders') label = 'Order Details';
          else if (previousSegment === 'customers') label = 'Customer Profile';
          else if (previousSegment === 'services') label = 'Service Details';
          else label = 'Details';
        }

        return {
          label,
          href: `/${pathSegments.slice(0, index + 1).join('/')}`,
        };
      });
      setBreadcrumbs(mapped);
    }
  }, [location]);

  // Keyboard shortcut for toggling sidebar (Ctrl/Cmd + B)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        onToggleSidebar();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        handleRefresh();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleSidebar]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 px-2.5 pt-[env(safe-area-inset-top)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sm:px-4 sm:pt-0 md:px-6">
      <div className="flex min-h-14 items-center gap-2 sm:min-h-16 sm:gap-3 md:gap-4">
      {/* Sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="h-9 w-9 shrink-0 rounded-2xl border border-border/70 bg-card/70 shadow-sm hover:bg-card"
        title={isSidebarVisible ? "Hide menu" : "Show menu"}
      >
        {isMobile ? (
          <Menu className="h-5 w-5" />
        ) : isSidebarVisible ? (
          <PanelLeftClose className="h-4 w-4" />
        ) : (
          <PanelLeftOpen className="h-4 w-4" />
        )}
      </Button>

      {/* Breadcrumbs — hide on mobile to save space */}
      {!isMobile && (
        <div className="hidden min-w-0 flex-1 items-center gap-3 sm:flex">
          <div className="min-w-0 flex-1 rounded-2xl border border-border/70 bg-card/70 px-3 py-2 shadow-sm">
        <Breadcrumb className="min-w-0">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
          </div>
          <div className="hidden items-center gap-2 rounded-2xl border border-border/70 bg-card/70 px-3 py-2 text-xs font-semibold text-muted-foreground shadow-sm xl:flex">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            <span>{todayLabel}</span>
          </div>
        </div>
      )}

      {/* Mobile: show current page title instead of breadcrumbs */}
      {isMobile && (
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Workspace</p>
          <h1 className="max-w-[42vw] truncate text-sm font-semibold">{currentPage}</h1>
        </div>
      )}

      {/* Search */}
      <div className={isMobile ? "ml-auto" : "ml-auto min-w-0 w-[200px] sm:w-[240px] md:w-[300px] lg:w-[380px]"}>
        <GlobalSearch compact={isMobile} />
      </div>

      {/* Action buttons */}
      <div className="flex shrink-0 items-center gap-1 rounded-2xl border border-border/70 bg-card/70 px-1.5 py-1 shadow-sm sm:px-2">
        {/* Keyboard shortcuts — hide on mobile */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={showShortcuts}
            className="h-8 w-8 rounded-xl"
            title="Keyboard Shortcuts (F1)"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 rounded-xl"
            title="Refresh app (F5)"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
        <ThemeToggle />
        <NotificationCenter />
        <UserMenu />
      </div>
      </div>
    </header>
  );
}
