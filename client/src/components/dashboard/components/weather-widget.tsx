import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Cloud, Sun, CloudRain, Snowflake, ThermometerSun, Loader2 } from "lucide-react";

export default function WeatherWidget() {
    const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [geoError, setGeoError] = useState<string | null>(null);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Round coordinates to 2 decimal places (approx 1km resolution) to highly optimize cache hits
                    // and prevent excessive API calls when moving slightly
                    const lat = parseFloat(position.coords.latitude.toFixed(2));
                    const lon = parseFloat(position.coords.longitude.toFixed(2));
                    setLocation({ lat, lon });
                },
                (error) => {
                    console.error("Error getting geolocation:", error);
                    setGeoError("Location access denied. Showing default.");
                    // Fallback to Pollachi, Tamil Nadu
                    setLocation({ lat: 10.66, lon: 77.01 });
                }
            );
        } else {
            setGeoError("Geolocation not supported. Showing default.");
            setLocation({ lat: 10.66, lon: 77.01 });
        }
    }, []);

    const fetchWeather = async () => {
        if (!location) throw new Error("Location not available");

        const cacheKey = `fabzclean_weather_${location.lat}_${location.lon}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            try {
                const { timestamp, data } = JSON.parse(cached);
                // Use a 1-hour cache expiry to stay extremely conservative on API usage
                if (Date.now() - timestamp < 60 * 60 * 1000) {
                    return data;
                }
            } catch (e) {
                console.error("Failed to parse cached weather:", e);
            }
        }

        const apiKey = "8068425b839e87ae5d645b2c572f6c64";
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric`;
        const res = await fetch(url);

        if (!res.ok) {
            throw new Error("Failed to fetch weather data");
        }

        const data = await res.json();

        // Save successfully fetched data to cache
        localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            data
        }));

        return data;
    };

    const { data: weather, isLoading, isError } = useQuery({
        queryKey: ['weather', location?.lat, location?.lon],
        queryFn: fetchWeather,
        enabled: !!location,
        staleTime: 60 * 60 * 1000, // 1 hour caching to stay within 500 calls/day
        gcTime: 60 * 60 * 1000,
    });

    const getLaundryAdvice = (description: string) => {
        const desc = description.toLowerCase();
        if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('thunder')) {
            return { emoji: "🌧️", text: "Rainy. Indoor drying only!", icon: <CloudRain className="h-4 w-4 text-blue-500" /> };
        }
        if (desc.includes('snow')) {
            return { emoji: "❄️", text: "Snowy. Indoor drying only!", icon: <Snowflake className="h-4 w-4 text-blue-300" /> };
        }
        if (desc.includes('cloud')) {
            return { emoji: "☁️", text: "Cloudy. Slower drying time.", icon: <Cloud className="h-4 w-4 text-gray-500" /> };
        }
        if (desc.includes('clear') || desc.includes('sun')) {
            return { emoji: "☀️", text: "Sunny. Perfect for drying!", icon: <Sun className="h-4 w-4 text-yellow-500" /> };
        }
        return { emoji: "🌤️", text: "Good conditions for drying.", icon: <ThermometerSun className="h-4 w-4 text-orange-500" /> };
    };

    return (
        <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Weather</CardTitle>
                {weather?.weather?.[0]?.description ? (
                    getLaundryAdvice(weather.weather[0].description).icon
                ) : (
                    <Cloud className="h-4 w-4 text-muted-foreground" />
                )}
            </CardHeader>
            <CardContent>
                {isLoading || !location ? (
                    <div className="flex items-center text-muted-foreground py-1">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-xs">Loading...</span>
                    </div>
                ) : isError ? (
                    <div className="text-xs text-red-500 mt-1">Unable to fetch weather</div>
                ) : (
                    <>
                        <div className="text-2xl font-bold text-foreground">
                            {Math.round(weather.main.temp)}°C
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1">
                            <p className="text-xs font-semibold text-foreground truncate capitalize">
                                {weather.name} • {weather.weather[0].description} {getLaundryAdvice(weather.weather[0].description).emoji}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                                💡 {getLaundryAdvice(weather.weather[0].description).text}
                            </p>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
