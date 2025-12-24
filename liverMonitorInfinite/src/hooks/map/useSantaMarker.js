import maplibregl from "maplibre-gl";
import { useEffect, useRef } from 'react';

export const useSantaMarker = (map, enabled, onIconClick) => {
    const markerRef = useRef(null);
    const animationFrameRef = useRef(null);

    useEffect(() => {
        if (!map.current) return;

        // Cleanup function to remove marker/animation if enabled toggles off or component unmounts
        const cleanup = () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
        };

        if (!enabled) {
            cleanup();
            return;
        }

        // Initialize Marker
        if (!markerRef.current) {
            const el = document.createElement('div');
            el.className = 'santa-marker-icon';
            el.innerHTML = ''; // Clear Emoji, using CSS background
            el.style.cursor = 'pointer';
            
            // Click Handler
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                // We need to construct the flight data at the moment of click
                const now = Date.now();
                const pos = calculateSantaPosition(now);
                
                if (onIconClick) {
                    onIconClick({
                        flightId: 'santa-claus-01',
                        callsign: 'SANTA1',
                        displayCallsign: 'SANTA1',
                        username: 'Santa Claus',
                        virtualOrganization: 'North Pole Aviation',
                        aircraftId: 'santa-sleigh',
                        liveryId: 'santa-livery',
                        ...pos // latitude, longitude, heading, altitude, speed
                    });
                }
            });

            markerRef.current = new maplibregl.Marker({ element: el })
                .setLngLat([0, 0])
                .addTo(map.current);
        }

        // Animation Loop
        const animate = () => {
            if (!markerRef.current) return;

            const now = Date.now();
            const pos = calculateSantaPosition(now);

            markerRef.current.setLngLat([pos.longitude, pos.latitude]);
            markerRef.current.setRotation(pos.heading);

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return cleanup;

    }, [map, enabled, onIconClick]);

    return markerRef;
};

// Helper to calculate Physics
const calculateSantaPosition = (time) => {
    // Speed: 1 Full Orbit (360 deg) in X minutes
    // Real satellites do it in ~90 mins. Santa is faster?
    // Let's make it 5 minutes for demo purposes (300 seconds)
    // 360 / 300 = 1.2 deg per second.
    // 1.2 * (time / 1000)
    
    // Using a fixed reference time to keep position consistent across reloads? 
    // Just using epoch is fine.
    
    const periodSeconds = 300; 
    const angle = (time / 1000) * (360 / periodSeconds);
    
    let longitude = (angle % 360);
    if (longitude > 180) longitude -= 360;

    // Latitude wave
    // Oscillate between +70 and -70
    // Frequency: 2 waves per orbit?
    const latAngle = angle * 2; // Twice as fast as longitude? or same?
    // Let's make him weave.
    const latitude = Math.sin(latAngle * (Math.PI / 180)) * 60;

    // Heading Calculation
    // We are moving +Longitude (East) and changing Latitude.
    // Heading is roughly 90 + derivative of Lat.
    // Lat = 60 * sin(2 * lon).
    // slope = 120 * cos(2 * lon).
    // Heading deviation = atan(slope).
    // But map rotation is 0=North, 90=East.
    // Vector = (dLon, dLat).
    // dLon is constant positive.
    // Angle = atan2(dLon, dLat).
    // Note: atan2(y, x) -> y is Lat, x is Lon? No, MapLibre rotation is degrees clockwise from North.
    // North (0, 1), East (1, 0).
    // dx = 1 (east), dy = slope.
    // angle = atan2(dx, dy) => atan2(1, slope).
    // Wait, atan2(1, 0) (Pure East) is 90 deg. Correct.
    
    const slope = Math.cos(latAngle * (Math.PI / 180)) * 2; // Approximate derivative factor
    // Using atan2 to get bearing
    // x = 1 (East component), y = slope (North component)
    // bearing in radians = atan2(x, y)
    // bearing in degrees = radians * 180 / PI
    
    const bearingRad = Math.atan2(1, slope); // 1 is East, Slope is North
    let heading = bearingRad * (180 / Math.PI);
    
    return {
        latitude,
        longitude,
        heading: heading,
        altitude: 35000 + Math.sin(time / 2000) * 1000, // Vary altitude slightly
        speed: 1500, // Super sonic santa
        verticalSpeed: 0
    };
};
