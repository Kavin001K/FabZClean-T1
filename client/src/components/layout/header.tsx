import { Link, useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NotificationCenter } from '@/components/notification-center';
import { GlobalSearch } from '@/components/global-search';

const capitalize = (s: string) => {
  // Handle special cases for better display
  if (s === 'employee-dashboard') return 'Employee Dashboard';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarVisible: boolean;
}

export function Header({ onToggleSidebar, isSidebarVisible }: HeaderProps) {
  const [location] = useLocation();
  const [paths, setPaths] = useState(['Dashboard']);

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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleSidebar]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="h-8 w-8"
        title={isSidebarVisible ? "Hide sidebar (⌘B)" : "Show sidebar (⌘B)"}
      >
        {isSidebarVisible ? (
          <PanelLeftClose className="h-4 w-4" />
        ) : (
          <PanelLeftOpen className="h-4 w-4" />
        )}
      </Button>
      <Breadcrumb>
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
      <div className="ml-auto flex-1 md:max-w-md lg:max-w-lg xl:max-w-xl">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-2">
        <NotificationCenter />
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
            <img src="https://placehold.co/36x36/EFEFEF/333333?text=A" width={36} height={36} alt="Avatar" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}