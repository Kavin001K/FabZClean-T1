import { useEffect } from "react";
import { useParams } from "wouter";
import { Loader2 } from "lucide-react";
import { PUBLIC_WEBSITE_URL, getPublicTrackOrderUrl } from "@/lib/public-website";

export default function PublicOrderTracking() {
  const params = useParams<{ orderNumber?: string }>();

  useEffect(() => {
    const orderNumber = params.orderNumber?.trim();
    const target = orderNumber
      ? getPublicTrackOrderUrl(orderNumber)
      : `${PUBLIC_WEBSITE_URL}/trackorder`;

    window.location.replace(target);
  }, [params.orderNumber]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Redirecting to Fab Clean tracking</h1>
        <p className="text-sm text-muted-foreground">
          Public order tracking now lives on the Fab Clean website.
        </p>
      </div>
    </div>
  );
}
