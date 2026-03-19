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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [location] = useLocation();

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

      <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        {!isMobile && isSidebarOpen && <Sidebar className="w-64 shrink-0" />}

        {/* Mobile/Tablet Sidebar Drawer */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="w-72 max-w-[85vw] border-none p-0">
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
            "scrollbar-thin flex-1 min-h-0 overflow-x-auto overflow-y-auto overscroll-y-contain scroll-smooth p-3 sm:p-4 md:p-6",
            isMobile ? "pb-[calc(5.75rem+env(safe-area-inset-bottom))]" : "pb-6"
          )}>
            <ErrorBoundary>
              <div className="mx-auto w-full max-w-[1400px]">
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
