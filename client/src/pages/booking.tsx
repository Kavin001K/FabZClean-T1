import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CalendarDays, RefreshCcw, CloudRain, SunMedium } from "lucide-react";

interface WeatherSummary {
  location: string;
  condition: string;
  temperature: number;
  humidity?: number;
  recommendation?: string;
}

interface OperationalSuggestionResponse {
  analytics: {
    totalOrders: number;
    pendingOrders: number;
    overdueOrders: number;
    revenueLast30Days: number;
    completionRate: number;
    topService?: string;
  };
  weather?: WeatherSummary;
  recommendation: string;
  recommendations: string[];
}

interface ApiResponseEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export default function BookingPage() {
  const [weatherLocation, setWeatherLocation] = useState("Bengaluru");
  const [weatherInput, setWeatherInput] = useState("Bengaluru");
  const { toast } = useToast();

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<OperationalSuggestionResponse>({
    queryKey: ["operational-suggestion", weatherLocation],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (weatherLocation) {
        params.set("weatherLocation", weatherLocation);
      }

      const response = await fetch(`/api/v1/algorithms/operational-suggestion?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Unable to load suggestions: ${response.statusText}`);
      }
      const payload = await response.json() as ApiResponseEnvelope<OperationalSuggestionResponse>;
      if (!payload?.data) {
        throw new Error(payload?.message || "Invalid booking suggestion response");
      }
      return payload.data;
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!isError) return;
    toast({
      title: "Failed to load booking suggestions",
      description: "Unexpected error while loading ERP and weather guidance.",
      variant: "destructive",
    });
  }, [isError, toast]);

  const suggestionText = data?.recommendation || "Loading forecast-driven booking guidance...";
  const suggestions = data?.recommendations || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Booking</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review ERP and weather-aware guidance before creating new bookings.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => refetch()} disabled={isLoading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh Suggestions
          </Button>
          <Button asChild>
            <Link href="/create-order">Create New Booking</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            AI Booking Guidance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                This view uses your latest ERP order activity plus available weather signal to suggest the safest booking cadence and staffing focus.
              </p>
              <div className="rounded-lg border border-border bg-muted p-4">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Fetching operational guidance...
                  </div>
                ) : isError ? (
                  <div className="text-sm text-destructive">Unable to load AI guidance right now.</div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-base font-medium">{suggestionText}</p>
                    {suggestions.length > 0 && (
                      <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                        {suggestions.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 rounded-lg border border-border bg-slate-50 p-4">
              <div className="space-y-2">
                <Label htmlFor="weatherLocation">Weather lookup</Label>
                <Input
                  id="weatherLocation"
                  value={weatherInput}
                  onChange={(event) => setWeatherInput(event.target.value)}
                  placeholder="City or postal code"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWeatherLocation(weatherInput.trim() || "Bengaluru")}
                  disabled={isLoading}
                >
                  Apply location
                </Button>
              </div>
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">Weather data</span>
                  {data?.weather ? (
                    <span className="inline-flex items-center gap-1 text-sm text-foreground">
                      {String(data.weather.condition || '').toLowerCase().includes('rain') ? (
                        <CloudRain className="h-4 w-4 text-blue-600" />
                      ) : (
                        <SunMedium className="h-4 w-4 text-amber-500" />
                      )}
                      {Math.round(data.weather.temperature)}°C
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">No weather summary</span>
                  )}
                </div>
                {data?.weather ? (
                  <div className="mt-3 text-sm leading-6 text-muted-foreground">
                    <p>{data.weather.location}</p>
                    <p>{data.weather.condition}, {Math.round(data.weather.temperature)}°C{data.weather.humidity ? ` · ${data.weather.humidity}% humidity` : ''}</p>
                    {data.weather.recommendation && <p className="mt-2 text-xs text-foreground">{data.weather.recommendation}</p>}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Weather lookup is optional. Configure EXTERNAL_API_KEY + EXTERNAL_API_BASE_URL for real weather signal.</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ERP booking health</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <div className="text-sm uppercase tracking-wide text-muted-foreground">Pending bookings</div>
            <div className="mt-2 text-3xl font-semibold">{data?.analytics.pendingOrders ?? '—'}</div>
          </div>
          <div className="rounded-lg border border-border p-4">
            <div className="text-sm uppercase tracking-wide text-muted-foreground">Overdue pickups</div>
            <div className="mt-2 text-3xl font-semibold">{data?.analytics.overdueOrders ?? '—'}</div>
          </div>
          <div className="rounded-lg border border-border p-4">
            <div className="text-sm uppercase tracking-wide text-muted-foreground">Revenue (last 30d)</div>
            <div className="mt-2 text-3xl font-semibold">₹{data?.analytics.revenueLast30Days?.toLocaleString() ?? '—'}</div>
          </div>
          <div className="rounded-lg border border-border p-4">
            <div className="text-sm uppercase tracking-wide text-muted-foreground">Completion rate</div>
            <div className="mt-2 text-3xl font-semibold">{data?.analytics.completionRate?.toFixed(1) ?? '—'}%</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
