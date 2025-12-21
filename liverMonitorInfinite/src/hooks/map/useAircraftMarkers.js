import maplibregl from "maplibre-gl";
import { useEffect, useRef } from 'react';
import dataSetIconAircraft from '../../components/dataSetIconAircraft.json';
import staffData from '../../components/staff.json';
import stremerData from '../../components/Stremer.json';

// Shared constant or passed as prop? 
// Ideally passed or defined here if not used elsewhere.
// But mapSession uses them. Better to keep imports here.

export const useAircraftMarkers = (map, flightsData, onIconClick, savedUsername, savedVAName, removePolylines, setSelectedFlightId, updateTrajectory, onMarkerUpdate) => {
    const markers = useRef({});
    const flightsRef = useRef(new Map()); // Map<flightId, { startLng, startLat, endLng, endLat, startTime, duration, heading }>
    const animationFrameRef = useRef();

    // 1. Manage Markers and Flight Data Sync
    useEffect(() => {
        if (!flightsData || !Array.isArray(flightsData) || !map.current) return;

        const activeIds = new Set();
        const now = Date.now();

        flightsData.forEach(flight => {
             // ... (Keep existing logic)
             activeIds.add(flight.flightId);
             
             // 1. Maintain Flight Data for Animation
             const prev = flightsRef.current.get(flight.flightId);
             
             if (prev) {
                 if (prev.endLng !== flight.longitude || prev.endLat !== flight.latitude) {
                      flightsRef.current.set(flight.flightId, {
                          startLng: prev.currentLng || prev.endLng,
                          startLat: prev.currentLat || prev.endLat,
                          endLng: flight.longitude,
                          endLat: flight.latitude,
                          startTime: now,
                          duration: 4000, 
                          heading: flight.heading,
                          currentLng: prev.currentLng,
                          currentLat: prev.currentLat
                      });
                 } else {
                     prev.heading = flight.heading;
                 }
             } else {
                 flightsRef.current.set(flight.flightId, {
                     startLng: flight.longitude,
                     startLat: flight.latitude,
                     endLng: flight.longitude,
                     endLat: flight.latitude,
                     startTime: now,
                     duration: 1000,
                     heading: flight.heading,
                     currentLng: flight.longitude,
                     currentLat: flight.latitude
                 });
             }

             // 2. Create Marker if missing
             if (!markers.current[flight.flightId]) {
                 const { latitude, longitude, heading, username, virtualOrganization, aircraftId, flightId } = flight;
                 
                const el = document.createElement('div');
                const streamer = stremerData.find(st => st.username === username);
                const isStaff = staffData.some(staff => staff.username === username);
                const aircraft = dataSetIconAircraft.GA.find(ac => ac.id === aircraftId);
    
                el.className = 'airplane-icon smooth-marker'; 
                if (!username || username === null) {
                  el.className += ' airplane-icon';
                } else if (username === savedUsername) {
                  el.className += ' special-airplane-icon';
                } else if (virtualOrganization && virtualOrganization === savedVAName) {
                  el.className += ' va-airplane-icon';
                } else if (streamer && (streamer.twitch || streamer.youtube)) {
                  el.className += ' online-airplane-icon';
                } else if (isStaff) {
                  el.className += ' staff-airplane-icon';
                } else if (aircraft) {   
                  el.className += ' custom-aircraft-icon';
                } else {
                  el.className += ' airplane-icon';
                }

                // Interaction
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Callbacks from parent to handle selection
                    if (removePolylines) removePolylines(); // Safe validation
                    if (onIconClick) onIconClick(flight);
                    if (setSelectedFlightId) setSelectedFlightId(flight.flightId);
                    if (updateTrajectory) updateTrajectory(flight); 
                });
    
                const newMarker = new maplibregl.Marker({ element: el })
                    .setLngLat([longitude, latitude])
                    .setRotation(heading)
                    .addTo(map.current);
                
                markers.current[flightId] = newMarker;
             }
        });
        
        // 3. Remove interpolated data and markers for missing flights
        Object.keys(markers.current).forEach(id => {
            if (!activeIds.has(id)) {
                markers.current[id].remove();
                delete markers.current[id];
            }
        });
        
        for (const [id] of flightsRef.current) {
            if (!activeIds.has(id)) {
                flightsRef.current.delete(id);
            }
        }

    }, [flightsData, onIconClick, map, savedUsername, savedVAName, removePolylines, setSelectedFlightId, updateTrajectory]);

    // 2. Animation Loop
    const animate = () => {
        const now = Date.now();
        
        flightsRef.current.forEach((data, flightId) => {
            const marker = markers.current[flightId];
            if (!marker) return;

            let progress = (now - data.startTime) / data.duration;
            if (progress > 1) progress = 1;

            // Simple Lerp
            const lng = data.startLng + (data.endLng - data.startLng) * progress;
            const lat = data.startLat + (data.endLat - data.startLat) * progress;

            data.currentLng = lng;
            data.currentLat = lat;

            // Update Marker
            marker.setLngLat([lng, lat]);
            marker.setRotation(data.heading);
            
            // Callback for trajectory update
            if (onMarkerUpdate) {
                onMarkerUpdate(flightId, lng, lat);
            }
        });

        animationFrameRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [onMarkerUpdate]); // Re-bind if callback changes
    
    return { markers, flightsRef }; 
};
