import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cloud, CloudRain, Loader2, Snowflake, Sun, ThermometerSun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WeatherResponse = {
  name: string;
  main: {
    temp: number;
  };
  weather: Array<{
    description: string;
  }>;
};

type Coordinates = {
  lat: number;
  lon: number;
};

const DEFAULT_LOCATION: Coordinates = { lat: 10.66, lon: 77.01 };
const DEFAULT_WEATHER: WeatherResponse = {
  name: "Pollachi",
  main: { temp: 28 },
  weather: [{ description: "clear sky" }],
};
const WEATHER_CACHE_PREFIX = "fabzclean_weather";
const CACHE_TTL_MS = 60 * 60 * 1000;

function readWeatherCache(location: Coordinates): WeatherResponse | null {
  try {
    if (typeof window === "undefined") return null;
    const cached = window.localStorage.getItem(
      `${WEATHER_CACHE_PREFIX}_${location.lat}_${location.lon}`,
    );
    if (!cached) return null;

    const parsed = JSON.parse(cached) as { timestamp?: number; data?: WeatherResponse };
    if (!parsed.timestamp || !parsed.data) return null;
    if (Date.now() - parsed.timestamp >= CACHE_TTL_MS) return null;
    return parsed.data;
  } catch (error) {
    console.warn("Failed to read cached weather data:", error);
    return null;
  }
}

function writeWeatherCache(location: Coordinates, data: WeatherResponse) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      `${WEATHER_CACHE_PREFIX}_${location.lat}_${location.lon}`,
      JSON.stringify({ timestamp: Date.now(), data }),
    );
  } catch (error) {
    console.warn("Failed to cache weather data:", error);
  }
}

function normalizeWeatherResponse(data: unknown): WeatherResponse | null {
  if (!data || typeof data !== "object") return null;

  const candidate = data as Partial<WeatherResponse>;
  const name = typeof candidate.name === "string" ? candidate.name : DEFAULT_WEATHER.name;
  const temp = typeof candidate.main?.temp === "number" ? candidate.main.temp : DEFAULT_WEATHER.main.temp;
  const description =
    typeof candidate.weather?.[0]?.description === "string"
      ? candidate.weather[0].description
      : DEFAULT_WEATHER.weather[0].description;

  return {
    name,
    main: { temp },
    weather: [{ description }],
  };
}

export default function WeatherWidget() {
  const [location, setLocation] = useState<Coordinates>(DEFAULT_LOCATION);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoResolved, setGeoResolved] = useState(false);

  useEffect(() => {
    let isActive = true;

    const finishWithFallback = (message: string) => {
      if (!isActive) return;
      setGeoError(message);
      setLocation(DEFAULT_LOCATION);
      setGeoResolved(true);
    };

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      finishWithFallback("Location unavailable. Showing default weather.");
      return () => {
        isActive = false;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isActive) return;
        const lat = Number(position.coords.latitude.toFixed(2));
        const lon = Number(position.coords.longitude.toFixed(2));
        setLocation({ lat, lon });
        setGeoError(null);
        setGeoResolved(true);
      },
      (error) => {
        console.warn("Geolocation unavailable, using fallback weather:", {
          code: error.code,
          message: error.message,
        });
        finishWithFallback("Live location unavailable. Showing default weather.");
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 10 * 60 * 1000,
      },
    );

    return () => {
      isActive = false;
    };
  }, []);

  const cachedWeather = useMemo(() => readWeatherCache(location), [location]);

  const { data: weather, isLoading } = useQuery<WeatherResponse>({
    queryKey: ["weather", location.lat, location.lon],
    enabled: geoResolved,
    initialData: cachedWeather ?? DEFAULT_WEATHER,
    staleTime: CACHE_TTL_MS,
    gcTime: CACHE_TTL_MS,
    retry: 0,
    queryFn: async ({ signal }) => {
      const cached = readWeatherCache(location);
      if (cached) {
        return cached;
      }

      try {
        const apiKey = "8068425b839e87ae5d645b2c572f6c64";
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric`;
        const response = await fetch(url, { signal });

        if (!response.ok) {
          throw new Error(`Weather request failed with status ${response.status}`);
        }

        const rawData = (await response.json()) as unknown;
        const normalizedData = normalizeWeatherResponse(rawData);
        if (!normalizedData) {
          throw new Error("Weather response format was invalid");
        }

        writeWeatherCache(location, normalizedData);
        return normalizedData;
      } catch (error) {
        if ((error as Error)?.name === "AbortError") {
          throw error;
        }

        console.warn("Unable to fetch live weather, using fallback:", error);
        return cachedWeather ?? DEFAULT_WEATHER;
      }
    },
  });

  const safeWeather = weather ?? cachedWeather ?? DEFAULT_WEATHER;

  const getLaundryAdvice = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes("rain") || desc.includes("drizzle") || desc.includes("thunder")) {
      return { emoji: "🌧️", text: "Rainy. Indoor drying only!", icon: <CloudRain className="h-4 w-4 text-blue-500" /> };
    }
    if (desc.includes("snow")) {
      return { emoji: "❄️", text: "Snowy. Indoor drying only!", icon: <Snowflake className="h-4 w-4 text-blue-300" /> };
    }
    if (desc.includes("cloud")) {
      return { emoji: "☁️", text: "Cloudy. Slower drying time.", icon: <Cloud className="h-4 w-4 text-gray-500" /> };
    }
    if (desc.includes("clear") || desc.includes("sun")) {
      return { emoji: "☀️", text: "Sunny. Perfect for drying!", icon: <Sun className="h-4 w-4 text-yellow-500" /> };
    }
    return { emoji: "🌤️", text: "Good conditions for drying.", icon: <ThermometerSun className="h-4 w-4 text-orange-500" /> };
  };

  const description = safeWeather.weather[0]?.description ?? DEFAULT_WEATHER.weather[0].description;
  const advice = getLaundryAdvice(description);

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Weather</CardTitle>
        {advice.icon}
      </CardHeader>
      <CardContent>
        {!geoResolved && isLoading ? (
          <div className="flex items-center py-1 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span className="text-xs">Loading...</span>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-foreground">
              {Math.round(safeWeather.main.temp)}°C
            </div>
            <div className="mt-1 flex flex-col gap-0.5">
              <p className="truncate text-xs font-semibold capitalize text-foreground">
                {safeWeather.name} • {description} {advice.emoji}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                💡 {advice.text}
              </p>
              {geoError ? (
                <p className="truncate text-[10px] text-muted-foreground">{geoError}</p>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
