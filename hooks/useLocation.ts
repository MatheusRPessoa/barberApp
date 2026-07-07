import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export interface Coords {
    lat: number;
    lng: number;
}

export function useLocation() {
    const [coords, setCoords] = useState<Coords | null>(null);
    const [placeLabel, setPlaceLabel] = useState<string | null>(null);
    const [denied, setDenied] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    if (!cancelled) setDenied(true);
                    return;
                }

                const position = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                if (cancelled) return;
                setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });

                const places = await Location.reverseGeocodeAsync({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                if (cancelled) return;
                const p = places[0];
                if (p) setPlaceLabel([p.district ?? p.subregion, p.city ?? p.region].filter(Boolean).join(', '));
            } catch {
                // GPS indisponível — segue sem localização
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    return { coords, placeLabel, denied };
}
