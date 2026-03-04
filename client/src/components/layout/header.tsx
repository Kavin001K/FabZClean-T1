import { Link, useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen, RefreshCw, Keyboard } from 'lucide-react';
import { useShortcuts } from '@/components/shortcuts-provider';
import { NotificationCenter } from '@/components/notification-center';
import { GlobalSearch } from '@/components/global-search';
import { UserMenu } from '@/components/layout/user-menu';

const capitalize = (s: string) => {
  if (s === 'employee-dashboard') return 'Employee Dashboard';
  if (s === 'create-order') return 'New Order';
  if (s === 'print-queue') return 'Print Tags';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarVisible: boolean;
  isMobile?: boolean;
}

export function Header({ onToggleSidebar, isSidebarVisible, isMobile = false }: HeaderProps) {
  const [location] = useLocation();
  const [paths, setPaths] = useState(['Dashboard']);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { showShortcuts } = useShortcuts();

  useEffect(() => {
    const pathSegments = location.split('/').filter(p => p);
    if (pathSegments.length === 0) {
      setPaths(['Dashboard']);
    } else {
      setPaths(pathSegments.map(capitalize));
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
    <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center gap-2 md:gap-4 border-b bg-background px-3 md:px-6">
      {/* Sidebar toggle — hidden on mobile since we use bottom nav */}
      {!isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-8 w-8 shrink-0"
          title={isSidebarVisible ? "Hide sidebar (⌘B)" : "Show sidebar (⌘B)"}
        >
          {isSidebarVisible ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Breadcrumbs — hide on mobile to save space */}
      {!isMobile && (
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {paths.map((path, index) => (
              <div key={path} className="flex items-center">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === paths.length - 1 ? (
                    <BreadcrumbPage>{path}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={`/${path.toLowerCase()}`}>{path}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Mobile: show current page title instead of breadcrumbs */}
      {isMobile && (
        <h1 className="text-sm font-semibold truncate">
          {paths[paths.length - 1] || 'Dashboard'}
        </h1>
      )}

      {/* Search — constrained width, never grows into action buttons */}
      <div className="ml-auto w-auto min-w-0 max-w-[160px] sm:max-w-[220px] md:max-w-sm lg:max-w-md">
        <GlobalSearch />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        {/* Keyboard shortcuts — hide on mobile */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={showShortcuts}
            className="h-8 w-8"
            title="Keyboard Shortcuts (F1)"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-8 w-8"
          title="Refresh app (F5)"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
        <NotificationCenter />
        <UserMenu />
      </div>
    </header>
  );
}