import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun, User, Menu, X } from "lucide-react";

interface HeaderProps {
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
}

export default function Header({ sidebarCollapsed, onSidebarToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="glass-effect border-b border-border px-6 sm:px-8 py-4 sm:py-6 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Navigation Toggle Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={onSidebarToggle}
            className="flex-shrink-0"
            data-testid="sidebar-toggle"
          >
            {sidebarCollapsed ? (
              <Menu className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <X className="h-[1.2rem] w-[1.2rem]" />
            )}
            <span className="sr-only">Toggle navigation</span>
          </Button>
          
          <div>
            <h1 className="text-lg sm:text-h1">
              Operations Dashboard
            </h1>
            <p className="text-xs sm:text-body text-muted-foreground mt-1">
              Real-time business intelligence and command center
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-caption text-muted-foreground">Last updated</p>
            <p className="text-label text-foreground">2 minutes ago</p>
          </div>
          
          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            data-testid="theme-toggle"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
}
