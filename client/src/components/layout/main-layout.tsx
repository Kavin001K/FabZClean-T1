import { Sidebar } from './sidebar';
import { Header } from './header';
import ErrorBoundary from '@/components/ui/error-boundary';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Establishes the primary desktop layout with a fixed sidebar and main content area.
 * The main content div has a left padding (`pl-60`) equal to the sidebar's
 * width to prevent overlap.
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <Sidebar />
      <div className="flex flex-col w-full pl-60"> {/* pl-60 must match sidebar width */}
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
