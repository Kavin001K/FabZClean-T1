import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { BottomNav } from './bottom-nav';
import ErrorBoundary from '@/components/ui/error-boundary';
import { SessionTimeoutWarning } from '@/components/session-timeout-warning';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Responsive layout:
 * - Desktop (sm+): Sidebar + Header + Content
 * - Mobile (<sm): Header + Content + BottomNav (no sidebar)
 */
export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // On mobile, always hide sidebar
  const showSidebar = !isMobile && isSidebarVisible;

  return (
    <>
      <SessionTimeoutWarning />

      <div className="flex min-h-screen w-full bg-muted/40">
        {showSidebar && <Sidebar />}
        <div className={`flex flex-col w-full transition-all duration-300 ease-in-out ${showSidebar ? 'pl-60' : 'pl-0'}`}>
          <Header onToggleSidebar={toggleSidebar} isSidebarVisible={showSidebar} />
          <main className={`flex-1 overflow-y-auto p-4 md:p-6 ${isMobile ? 'pb-24' : ''}`}>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      {isMobile && <BottomNav />}
    </>
  );
}
