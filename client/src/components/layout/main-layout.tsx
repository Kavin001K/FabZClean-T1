import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Footer } from "./footer";
import ErrorBoundary from "@/components/ui/error-boundary";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className={`flex flex-1 flex-col transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? "lg:ml-16" : "lg:ml-72"
      }`}>
        <Header 
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
        <main className="flex-1 overflow-y-auto bg-muted/20 px-6 pb-6 lg:px-8 lg:pb-8">
          <div className="max-w-none mx-auto">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
        <Footer isSidebarCollapsed={isSidebarCollapsed} />
      </div>
    </div>
  );
}
