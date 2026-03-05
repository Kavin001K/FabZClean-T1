import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface FooterProps {
  isMobile?: boolean;
}

export function Footer({ isMobile = false }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "border-t bg-card/60 text-muted-foreground backdrop-blur-sm",
        isMobile ? "mt-5 px-3 py-3 text-xs" : "mt-6 px-4 py-3 text-sm sm:px-6"
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1400px] gap-2",
          isMobile ? "flex-col items-start" : "flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"
        )}
      >
        <p className="text-safe-wrap">© {year} FabZClean. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/terms" className="transition-colors hover:text-primary">Terms</Link>
          <Link href="/privacy" className="transition-colors hover:text-primary">Privacy</Link>
          <Link href="/cookies" className="transition-colors hover:text-primary">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}
