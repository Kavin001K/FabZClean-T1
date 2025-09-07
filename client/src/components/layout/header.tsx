import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun, User, Menu } from "lucide-react";

interface HeaderProps {
  onSidebarToggle: () => void;
}

export default function Header({ onSidebarToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          onClick={onSidebarToggle}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <h1 className="text-xl font-bold">Dashboard</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-muted-foreground">Last updated</p>
          <p className="text-sm font-medium">2 minutes ago</p>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>
    </header>
  );
}
