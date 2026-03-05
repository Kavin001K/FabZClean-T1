import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { BottomNav } from './bottom-nav';
import ErrorBoundary from '@/components/ui/error-boundary';
import { SessionTimeoutWarning } from '@/components/session-timeout-warning';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Responsive layout:
 * - Desktop (md+): Sidebar + Header + Content
 * - Tablet (sm–md): Header + Content + BottomNav (no sidebar)
 * - Mobile (<sm): Header + Content + BottomNav (no sidebar)
 */
export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // Use lg as mobile breakpoint for sidebar
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  return (
    <>
      <SessionTimeoutWarning />

      <div className="flex min-h-screen w-full bg-background">
        {/* Desktop Sidebar (lg+) */}
        {!isMobile && isSidebarOpen && (
          <Sidebar className="w-64" />
        )}

        {/* Mobile/Tablet Sidebar Drawer */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-64 border-none">
            <Sidebar className="w-full border-none" onClose={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        <div
          className={cn(
            "flex flex-col w-full min-w-0 transition-all duration-300 ease-in-out",
            !isMobile && isSidebarOpen ? "pl-64" : "pl-0"
          )}
        >
          <Header
            onToggleSidebar={toggleSidebar}
            isSidebarVisible={isMobile ? isMobileMenuOpen : isSidebarOpen}
            isMobile={isMobile}
          />
          <main className={cn(
            "flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6",
            isMobile ? "pb-24" : "pb-6"
          )}>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>

      {/* Mobile/tablet bottom navigation */}
      {isMobile && <BottomNav />}
    </>
  );
}
