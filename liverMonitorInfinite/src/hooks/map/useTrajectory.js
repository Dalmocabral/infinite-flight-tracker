import { useEffect, useRef } from 'react';
import ApiService from '../../components/ApiService';

export const useTrajectory = (map, sessionId, selectedFlightId, flightsData) => {
    const currentPolylineRef = useRef([]);

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

    const updateTrajectory = async (flight) => {
        if (!map.current) return;

        try {
          const routeData = await ApiService.getRoute(sessionId, flight.flightId);
          
          if (routeData && routeData.length > 0) {
              const getColorFromAltitude = (altitude) => {
                  if (altitude < 100) return '#FF0000';
                  if (altitude < 2000) return '#FF4500';
                  if (altitude < 3000) return '#FFFF00';
                  if (altitude < 5000) return '#00FF00';
                  if (altitude < 10000) return '#32CD32';
                  if (altitude < 15000) return '#00FA9A';
                  if (altitude < 20000) return '#00FFFF';
                  if (altitude < 25000) return '#1E90FF';
                  return '#0000FF';
              };
  
              const segments = [];
              // Add current position to route
              const rawPoints = [...routeData, { latitude: flight.latitude, longitude: flight.longitude, altitude: flight.altitude }];
              
              const coordsToUnwrap = rawPoints.map(p => [p.longitude, p.latitude]);
              const unwrapped = unwrapCoordinates(coordsToUnwrap);
              
              const allPoints = rawPoints.map((p, i) => ({
                  ...p,
                  longitude: unwrapped[i][0],
                  latitude: unwrapped[i][1]
              }));
  
              for (let i = 0; i < allPoints.length - 1; i++) {
                  const start = allPoints[i];
                  const end = allPoints[i+1];
                  
                  segments.push({
                      type: 'Feature',
                      geometry: {
                          type: 'LineString',
                          coordinates: [[start.longitude, start.latitude], [end.longitude, end.latitude]]
                      },
                      properties: {
                          color: getColorFromAltitude(start.altitude)
                      }
                  });
              }
  
              const routeSourceId = 'flight-history-source';
              const routeLayerId = 'flight-history-layer';
              
              if (map.current.getSource(routeSourceId)) {
                   map.current.getSource(routeSourceId).setData({
                      type: 'FeatureCollection',
                      features: segments
                   });
              } else {
                  map.current.addSource(routeSourceId, {
                      type: 'geojson',
                      data: {
                          type: 'FeatureCollection',
                          features: segments
                      }
                  });
  
                  map.current.addLayer({
                      id: routeLayerId,
                      type: 'line',
                      source: routeSourceId,
                      layout: {
                          'line-join': 'round',
                          'line-cap': 'round'
                      },
                      paint: {
                          'line-color': ['get', 'color'],
                          'line-width': 3
                      }
                  });
                  currentPolylineRef.current = [routeLayerId];
              }
          }
        } catch (error) {
            console.error("Error updating trajectory:", error);
        }
    };

    const updateTrajectoryLocal = (flightId, lng, lat) => {
        if (!map.current || flightId !== selectedFlightId) return;

        const routeSourceId = 'flight-history-source';
        if (!map.current.getSource(routeSourceId)) return;

        const source = map.current.getSource(routeSourceId);
        if (source && source._data) {
            const data = source._data; // Access current GeoJSON
            
            if (data.features && data.features.length > 0) {
                const lastFeature = data.features[data.features.length - 1];
                if (lastFeature.geometry.type === 'LineString') {
                    const coords = lastFeature.geometry.coordinates;
                    if (coords.length >= 2) {
                        const startLng = coords[0][0];
                        let newLng = lng;
                        let diff = newLng - startLng;
                        if (diff > 180) newLng -= 360;
                        else if (diff < -180) newLng += 360;
                        
                        lastFeature.geometry.coordinates = [coords[0], [newLng, lat]];
                        source.setData(data);
                    }
                }
            }
        }
    };

    const removePolylines = () => {
        if (!map.current) return;
        
        currentPolylineRef.current.forEach((layerId) => {
          if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
          
          if (layerId === 'flight-history-layer') {
              if (map.current.getSource('flight-history-source')) map.current.removeSource('flight-history-source');
          } else {
              if (map.current.getSource(layerId)) map.current.removeSource(layerId); 
          }
        });
        currentPolylineRef.current = [];
    };

    // Auto-update effect
    useEffect(() => {
        if (selectedFlightId && flightsData) {
            const flight = flightsData.find(f => f.flightId === selectedFlightId);
            if (flight) {
                updateTrajectory(flight);
            }
        }
    }, [flightsData, selectedFlightId]);

    return { updateTrajectory, updateTrajectoryLocal, removePolylines };
};
