import { useState, useEffect } from "react";

// returns the current hash location (minus the # symbol)
const currentLocation = () => {
    return window.location.hash.replace(/^#/, "").split("?")[0] || "/";
};

export const useHashLocation = () => {
    const [loc, setLoc] = useState(currentLocation());

    useEffect(() => {
        // this function is called whenever the hash changes
        const handler = () => setLoc(currentLocation());

        // subscribe to hash changes
        window.addEventListener("hashchange", handler);
        return () => window.removeEventListener("hashchange", handler);
    }, []);

    const navigate = (to: string) => (window.location.hash = to);
    return [loc, navigate] as [string, (to: string, ...args: any[]) => any];
};
