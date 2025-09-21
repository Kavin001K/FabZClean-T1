import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import ErrorBoundary from '@/components/ui/error-boundary';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Establishes the primary desktop layout with a toggleable sidebar and main content area.
 * The main content div adjusts its left padding based on sidebar visibility.
 */
export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      {isSidebarVisible && <Sidebar />}
      <div className={`flex flex-col w-full transition-all duration-300 ease-in-out ${
        isSidebarVisible ? 'pl-60' : 'pl-0'
      }`}>
        <Header onToggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
