import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { BottomNav } from './bottom-nav';
import ErrorBoundary from '@/components/ui/error-boundary';
import { SessionTimeoutWarning } from '@/components/session-timeout-warning';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Initial state from localStorage or default
    const saved = localStorage.getItem('fabzclean-sidebar-open');
    if (saved !== null) return saved === 'true';
    return false; // Default to closed as requested
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [location] = useLocation();

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsMobileMenuOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('fabzclean-sidebar-open', isSidebarOpen.toString());
  }, [isSidebarOpen]);

  // Ensure drawer closes after route transitions on mobile/tablet.
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [location, isMobile]);

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

      <div className="app-shell flex h-[calc(var(--app-dvh,1dvh)*100)] min-h-[100svh] w-full overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        {!isMobile && isSidebarOpen && (
          <div className="hidden shrink-0 p-4 pr-0 lg:flex">
            <Sidebar className="w-72 shrink-0" />
          </div>
        )}

        {/* Mobile/Tablet Sidebar Drawer */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="w-72 max-w-[85vw] border-none bg-transparent p-4 pr-0 shadow-none">
            <Sidebar className="w-full border-none" onClose={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        <div
          className={cn(
            "flex min-w-0 min-h-0 flex-1 flex-col transition-all duration-300 ease-in-out"
          )}
        >
          <Header
            onToggleSidebar={toggleSidebar}
            isSidebarVisible={isMobile ? isMobileMenuOpen : isSidebarOpen}
            isMobile={isMobile}
          />
          <main className={cn(
            "scrollbar-thin flex-1 min-h-0 overflow-x-hidden overflow-y-auto overscroll-y-contain scroll-smooth px-2.5 py-2.5 sm:px-4 sm:py-4 md:px-5 md:py-5",
            isMobile ? "pb-[calc(5.75rem+env(safe-area-inset-bottom)+0.5rem)]" : "pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          )}>
            <ErrorBoundary>
              <div className="mx-auto w-full max-w-[1380px] min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location}
                    initial={{ opacity: 0, y: 10, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.99 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>
            </ErrorBoundary>
          </main>
        </div>
      </div>

      {/* Mobile/tablet bottom navigation */}
      {isMobile && <BottomNav />}
    </>
  );
}
