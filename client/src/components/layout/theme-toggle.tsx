import { Moon, Sun } from "lucide-react";
import { useSettings } from "@/contexts/settings-context";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { settings, updateSetting } = useSettings();
  const theme = settings.theme || "light";

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    updateSetting("theme", nextTheme);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-xl border border-transparent px-0 hover:border-border hover:bg-muted"
      onClick={toggleTheme}
      title={`Toggle ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
