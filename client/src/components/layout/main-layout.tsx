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
 * - Desktop (md+): Sidebar + Header + Content
 * - Tablet (sm–md): Header + Content + BottomNav (no sidebar)
 * - Mobile (<sm): Header + Content + BottomNav (no sidebar)
 */
export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile/tablet viewport — hide sidebar below md (768px)
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // On mobile/tablet, always hide sidebar
  const showSidebar = !isMobile && isSidebarVisible;

  return (
    <>
      <SessionTimeoutWarning />

      <div className="flex min-h-screen w-full bg-muted/40">
        {showSidebar && <Sidebar />}
        <div
          className="flex flex-col w-full min-w-0 transition-all duration-300 ease-in-out"
          style={{ paddingLeft: showSidebar ? '15rem' : 0 }}
        >
          <Header onToggleSidebar={toggleSidebar} isSidebarVisible={showSidebar} isMobile={isMobile} />
          <main className={`flex-1 overflow-x-hidden overflow-y-auto ${isMobile ? 'pb-24' : ''}`}>
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
