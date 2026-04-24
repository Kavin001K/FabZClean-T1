import { useState, useEffect, useRef, useCallback } from 'react';
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
 * - Desktop (lg+): Hover-to-reveal sidebar + Header + Content (full width)
 * - Tablet/Mobile (<lg): Header + Content + BottomNav (sheet drawer)
 */
export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [location] = useLocation();

  // Hover-to-reveal refs
  const sidebarOverlayRef = useRef<HTMLDivElement>(null);
  const hoverIntentTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsMobileMenuOpen(false);
        setIsSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close drawer after route transitions on mobile/tablet
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
    // Also auto-hide desktop sidebar on route change
    setIsSidebarOpen(false);
  }, [location, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  // Desktop hover-to-reveal: show sidebar
  const showSidebar = useCallback(() => {
    if (isMobile) return;
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setIsSidebarOpen(true);
  }, [isMobile]);

  // Desktop hover-to-reveal: hide sidebar with delay
  const scheduleSidebarHide = useCallback(() => {
    if (isMobile) return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsSidebarOpen(false);
    }, 300);
  }, [isMobile]);

  // Hover zone: mouse enters left edge
  const handleHoverZoneEnter = useCallback(() => {
    if (isMobile) return;
    hoverIntentTimerRef.current = setTimeout(() => {
      showSidebar();
    }, 120); // slight delay to avoid accidental triggers
  }, [isMobile, showSidebar]);

  const handleHoverZoneLeave = useCallback(() => {
    if (hoverIntentTimerRef.current) {
      clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (hoverIntentTimerRef.current) clearTimeout(hoverIntentTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <>
      <SessionTimeoutWarning />

      <div className="app-shell flex h-[calc(var(--app-dvh,1dvh)*100)] min-h-[100svh] w-full overflow-hidden bg-background">
        {/* Desktop: Invisible hover zone on left edge (always present when sidebar hidden) */}
        {!isMobile && !isSidebarOpen && (
          <div
            className="fixed left-0 top-0 z-50 h-full w-4 cursor-default"
            onMouseEnter={handleHoverZoneEnter}
            onMouseLeave={handleHoverZoneLeave}
            aria-hidden="true"
          />
        )}

        {/* Desktop: Sidebar overlay (slides in from left) */}
        {!isMobile && (
          <>
            {/* Backdrop */}
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
                  onClick={() => setIsSidebarOpen(false)}
                />
              )}
            </AnimatePresence>

            {/* Sidebar panel */}
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div
                  ref={sidebarOverlayRef}
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                  className="fixed left-0 top-0 z-50 h-full p-4 pr-0"
                  onMouseEnter={showSidebar}
                  onMouseLeave={scheduleSidebarHide}
                >
                  <Sidebar
                    className="h-full w-72 shrink-0"
                    onClose={() => setIsSidebarOpen(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
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
              <div className="mx-auto w-full max-w-[1600px] min-w-0">
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
