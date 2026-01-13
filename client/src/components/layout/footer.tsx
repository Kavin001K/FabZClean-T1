import { cn } from "@/lib/utils";

interface FooterProps {
  isSidebarCollapsed: boolean;
}

export default function Footer({ isSidebarCollapsed }: FooterProps) {
  return (
    <footer className={cn(
      "border-t bg-card text-muted-foreground px-4 md:px-6 py-3 text-sm transition-all duration-300 ease-in-out",
      isSidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
    )}>
      <div className="flex items-center justify-between">
        <p>© 2025 Ace-Digital. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-primary">Terms of Service</a>
          <a href="#" className="hover:text-primary">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}
