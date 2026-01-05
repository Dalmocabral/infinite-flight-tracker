import maplibregl from "maplibre-gl";
import { useEffect, useRef } from 'react';
import staffData from '../../components/staff.json';
import stremerData from '../../components/Stremer.json';
import { DEFAULT_COLORS, getIconUrl } from '../../utils/iconTemplates';
import { useAircraftDefinitions } from '../useAircraftDefinitions';

export const useAircraftMarkers = (map, flightsData, onIconClick, savedUsername, savedVAName, savedColors, removePolylines, setSelectedFlightId, updateTrajectory, onMarkerUpdate) => {
    const markers = useRef({});
    const flightsRef = useRef(new Map()); 
    const animationFrameRef = useRef();

    // Fetch Aircraft Definitions
    const { data: aircraftDefinitions } = useAircraftDefinitions();
    
    // Merge colors
    const userColors = { ...DEFAULT_COLORS, ...savedColors };

    // 1. Manage Markers and Flight Data Sync
    useEffect(() => {
        if (!flightsData || !Array.isArray(flightsData) || !map.current) return;

        const activeIds = new Set();
        const now = Date.now();

        flightsData.forEach(flight => {
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
                
                const category = aircraftDefinitions ? aircraftDefinitions[aircraftId] : 'Medium'; 

                // Determine Icon Type and Base Color
                let iconType = 'A320'; 
                let iconColor = userColors.groundColor; 
                let sizeClass = 'airplane-icon'; 

                // 1. Determine Icon Type
                if (category === 'Large') { iconType = 'B77W'; sizeClass = 'large-aircraft-icon'; }
                else if (category === 'Fighter') { iconType = 'F16'; sizeClass = 'fighter-aircraft-icon'; }
                else if (category === 'MilitaryTransport') { iconType = 'C130'; sizeClass = 'military-cargo-icon'; }
                else if (category === 'GE') { iconType = 'C172'; sizeClass = 'custom-aircraft-icon'; } 
                else { iconType = 'A320'; sizeClass = 'airplane-icon'; } 

                // 2. Determine Color Priority
                if (!username) {
                     if (category === 'MilitaryTransport' || category === 'Fighter') iconColor = userColors.militaryColor;
                     else iconColor = userColors.groundColor;
                } else if (username === savedUsername) {
                    iconColor = userColors.myColor;
                } else if (virtualOrganization && virtualOrganization === savedVAName) {
                    iconColor = userColors.vaColor;
                } else if (streamer && (streamer.twitch || streamer.youtube)) {
                    iconColor = userColors.streamerColor;
                    el.className = 'airplane-icon smooth-marker online-airplane-icon'; 
                } else if (isStaff) {
                    iconColor = userColors.staffColor;
                } else {
                    // Normal User
                    if (category === 'MilitaryTransport' || category === 'Fighter') {
                        iconColor = userColors.militaryColor;
                    } else {
                        iconColor = userColors.groundColor; 
                    }
                }

                // 3. Apply Style
                // Reset class but keep marker base and size
                // Note: 'smooth-marker' is for transitions? css says 'smooth-marker' -> transition: transform...
                if (!el.className.includes('smooth-marker')) el.className = 'airplane-icon smooth-marker';
                
                el.className += ` ${sizeClass}`;
                
                // Generate Dynamic Icon URL
                const iconUrl = getIconUrl(iconType, iconColor);
                el.style.backgroundImage = `url('${iconUrl}')`;
                el.style.backgroundSize = 'contain';
                el.style.backgroundRepeat = 'no-repeat';
                el.style.backgroundPosition = 'center';

                // Interaction
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (removePolylines) removePolylines();
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

    }, [flightsData, onIconClick, map, savedUsername, savedVAName, savedColors, removePolylines, setSelectedFlightId, updateTrajectory]);

    // 2. Animation Loop
    const animate = () => {
        const now = Date.now();
        
        flightsRef.current.forEach((data, flightId) => {
            const marker = markers.current[flightId];
            if (!marker) return;

            let progress = (now - data.startTime) / data.duration;
            if (progress > 1) progress = 1;

            const lng = data.startLng + (data.endLng - data.startLng) * progress;
            const lat = data.startLat + (data.endLat - data.startLat) * progress;

            data.currentLng = lng;
            data.currentLat = lat;

            marker.setLngLat([lng, lat]);
            marker.setRotation(data.heading);
            
            if (onMarkerUpdate) {
                onMarkerUpdate(flightId, lng, lat);
            }
        });

        animationFrameRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [onMarkerUpdate]); 
    
    return { markers, flightsRef }; 
};
