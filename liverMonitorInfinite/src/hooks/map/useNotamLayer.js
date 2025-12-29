import { useEffect, useRef } from 'react';

export const useNotamLayer = (map, notams, atcData, isMapLoaded, onAtcClick) => {
    const atcDataRef = useRef(atcData);
    const notamsRef = useRef(notams);

    // Sync ref
    useEffect(() => {
        atcDataRef.current = atcData;
        notamsRef.current = notams;
    }, [atcData, notams]);

    useEffect(() => {
        if (!isMapLoaded || !map.current) return;

        // Initialize Source and Layers if missing
        if (!map.current.getSource('notam-boundaries')) {
            map.current.addSource('notam-boundaries', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            // Fill Layer (Hexagon content)
            map.current.addLayer({
                id: 'notam-fill',
                type: 'fill',
                source: 'notam-boundaries',
                paint: {
                    'fill-color': '#e6a100', // Orange/Gold-ish
                    'fill-opacity': 0.15
                }
            });

            // Outline Layer
            map.current.addLayer({
                id: 'notam-outline',
                type: 'line',
                source: 'notam-boundaries',
                paint: {
                    'line-color': '#e6a100',
                    'line-width': 2,
                    'line-dasharray': [2, 2] // Dashed line to distinguish from airspace
                }
            });
        }

        const updateNotamLayer = () => {
            if (!notams || notams.length === 0) {
                 if (map.current.getSource('notam-boundaries')) {
                    map.current.getSource('notam-boundaries').setData({
                        type: 'FeatureCollection', 
                        features: []
                    });
                 }
                 return;
            }

            // Group by ICAO to handle duplicates (take largest radius)
            const airportNotams = new Map();

            notams.forEach(notam => {
                if (!notam.icao || !notam.latitude || !notam.longitude) return;
                
                // NOTAM API radius is in Nautical Miles (NM)
                // 1 NM = 1852 meters. 
                // Default to 5nm if missing or 0
                const radiusNm = notam.radius > 0 ? notam.radius : 5;
                const radiusMeters = radiusNm * 1852;

                if (!airportNotams.has(notam.icao)) {
                    airportNotams.set(notam.icao, {
                        ...notam,
                        maxRadiusMeters: radiusMeters
                    });
                } else {
                    // Update to largest radius if multiple NOTAMs exist
                    const existing = airportNotams.get(notam.icao);
                    if (radiusMeters > existing.maxRadiusMeters) {
                        existing.maxRadiusMeters = radiusMeters;
                    }
                }
            });

            const features = [];

            airportNotams.forEach((data, icao) => {
                const { latitude, longitude, maxRadiusMeters } = data;
                
                const km = maxRadiusMeters / 1000;
                const coordinates = [];
                
                const distanceX = km / (111.32 * Math.cos((latitude * Math.PI) / 180));
                const distanceY = km / 110.574;

                // Hexagon generation
                for (let i = 0; i < 6; i++) {
                    const theta = (i * 2 * Math.PI) / 6;
                    const x = distanceX * Math.cos(theta);
                    const y = distanceY * Math.sin(theta);
                    coordinates.push([longitude + x, latitude + y]);
                }
                coordinates.push(coordinates[0]);

                features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [coordinates]
                    },
                    properties: {
                        id: icao,
                        type: 'NOTAM',
                        airportName: icao
                    }
                });
            });

            if (map.current.getSource('notam-boundaries')) {
                map.current.getSource('notam-boundaries').setData({
                    type: 'FeatureCollection',
                    features: features
                });
            }
        };

        updateNotamLayer();

    }, [map, notams, isMapLoaded]); // Depend only on notams mostly

    // Click Listener
    useEffect(() => {
        if (!isMapLoaded || !map.current) return;

        const onMapClick = (e) => {
            if (e.features && e.features.length > 0) {
                const feature = e.features[0];
                const airportName = feature.properties.airportName;
                
                // Only handle clicks for our layer
                if (feature.layer.id !== 'notam-fill') return;

                if (onAtcClick) {
                    // 1. Try to find a REAL active ATC
                    let targetAtc = null;
                    
                    if (atcDataRef.current) {
                        const airportAtcs = atcDataRef.current.filter(a => a.airportName === airportName);
                        if (airportAtcs.length > 0) {
                            // Sort by preference (Twr > Gnd...)
                            const preferredOrder = [1, 0, 4, 5, 6]; 
                            airportAtcs.sort((a, b) => {
                                const pA = preferredOrder.indexOf(a.type);
                                const pB = preferredOrder.indexOf(b.type);
                                return (pA === -1 ? 99 : pA) - (pB === -1 ? 99 : pB);
                            });
                            targetAtc = airportAtcs[0];
                        }
                    }

                    // 2. If no real ATC, create a Virtual ATC object
                    if (!targetAtc) {
                        targetAtc = {
                            airportName: airportName,
                            type: 99, // Custom type
                            username: "System",
                            frequency: "N/A"
                        };
                    }

                    onAtcClick(targetAtc);
                    
                    if (e.originalEvent) {
                       e.originalEvent.stopPropagation();
                    }
                }
            }
        };

        const onMouseEnter = () => map.current.getCanvas().style.cursor = 'pointer';
        const onMouseLeave = () => map.current.getCanvas().style.cursor = '';

        map.current.on('click', 'notam-fill', onMapClick);
        map.current.on('mouseenter', 'notam-fill', onMouseEnter);
        map.current.on('mouseleave', 'notam-fill', onMouseLeave);

        return () => {
             if (map.current) {
                map.current.off('click', 'notam-fill', onMapClick);
                map.current.off('mouseenter', 'notam-fill', onMouseEnter);
                map.current.off('mouseleave', 'notam-fill', onMouseLeave);
             }
        };
    }, [isMapLoaded, map, onAtcClick]);
};
