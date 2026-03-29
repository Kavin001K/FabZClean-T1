import { cn } from "@/lib/utils";

interface FooterProps {
  isMobile?: boolean;
}

export function Footer({ isMobile = false }: FooterProps) {
  return (
    <footer
      className={cn(
        "border-t bg-card/50 text-muted-foreground/70 backdrop-blur-sm",
        isMobile ? "mt-5 px-3 py-2 text-[10px]" : "mt-6 px-4 py-2 text-[11px] sm:px-6"
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1400px] gap-2",
          isMobile ? "flex-col items-start" : "flex-col items-start justify-between gap-2 sm:flex-row sm:items-center"
        )}
      >
        <p className="text-safe-wrap opacity-70">Copyright © 2026 Ace-Digital. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-2 opacity-70">
          <a
            href="https://acedigital.space/Terms%20of%20Service"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-primary"
          >
            Terms of Use
          </a>
          <span>|</span>
          <a
            href="https://acedigital.space/Privacy%20Policy"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-primary"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
}
