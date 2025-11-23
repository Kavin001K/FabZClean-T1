import { Loader2 } from "lucide-react";

interface FullscreenLoaderProps {
  message?: string;
}

export function FullscreenLoader({ message }: FullscreenLoaderProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
      <div className="rounded-full bg-muted p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      <div className="text-center">
        <p className="text-base font-medium text-foreground">
          {message ?? "Loading data..."}
        </p>
        <p className="text-sm text-muted-foreground">
          This usually only takes a second.
        </p>
      </div>
    </div>
  );
}

