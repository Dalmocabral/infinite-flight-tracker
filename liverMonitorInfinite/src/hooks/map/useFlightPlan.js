import { useEffect, useRef } from 'react';
import ApiService from '../../components/ApiService';

export const useFlightPlan = (map, sessionId, selectedFlightId) => {
    const currentLayerId = useRef('flight-plan-layer');
    const currentSourceId = useRef('flight-plan-source');

    const unwrapCoordinates = (points) => {
        if (!points || points.length === 0) return [];
        
        let unwrapped = [[points[0][0], points[0][1]]];
        let showPrevLng = points[0][0];
        let offset = 0;
    
        for (let i = 1; i < points.length; i++) {
          const [currentLng, currentLat] = points[i];
          let diff = currentLng - showPrevLng;
    
          if (diff > 180) {
            offset -= 360;
          } else if (diff < -180) {
            offset += 360;
          }
    
          unwrapped.push([currentLng + offset, currentLat]);
          showPrevLng = currentLng;
        }
        return unwrapped;
    };

    const updateFlightPlan = async (flightId) => {
        if (!map.current || !sessionId) return;

        try {
            const planData = await ApiService.getFlightPlan(sessionId, flightId);
            
            if (planData && planData.result && planData.result.flightPlanItems) {
                const items = planData.result.flightPlanItems;
                if (items.length < 2) return;

                // Extract coordinates [lng, lat] and filter out Null Island (0,0)
                const rawPoints = items
                    .map(item => [item.location.longitude, item.location.latitude])
                    .filter(p => !(p[0] === 0 && p[1] === 0)); // Remove [0,0] points
                
                if (rawPoints.length < 2) return;
                
                const coordinates = unwrapCoordinates(rawPoints);

                const geoJson = {
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: coordinates
                        }
                    }]
                };

                const sourceId = currentSourceId.current;
                const layerId = currentLayerId.current;

                if (map.current.getSource(sourceId)) {
                    map.current.getSource(sourceId).setData(geoJson);
                } else {
                    map.current.addSource(sourceId, {
                        type: 'geojson',
                        data: geoJson
                    });

                    map.current.addLayer({
                        id: layerId,
                        type: 'line',
                        source: sourceId,
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': '#000000', // Black
                            'line-width': 3,
                            'line-dasharray': [2, 3], // Dotted pattern
                            'line-opacity': 0.5 // Dimmed
                        }
                    });
                }
            }
        } catch (error) {
            console.warn("Error fetching flight plan:", error);
        }
    };

    const clearFlightPlan = () => {
        if (!map.current) return;
        const layerId = currentLayerId.current;
        const sourceId = currentSourceId.current;

        if (map.current.getLayer(layerId)) {
            map.current.removeLayer(layerId);
        }
        if (map.current.getSource(sourceId)) {
            map.current.removeSource(sourceId);
        }
    };

    // Effect to update when selection changes
    useEffect(() => {
        if (selectedFlightId) {
            updateFlightPlan(selectedFlightId);
        } else {
            clearFlightPlan();
        }
    }, [selectedFlightId, sessionId]);

    return { updateFlightPlan, clearFlightPlan };
};
