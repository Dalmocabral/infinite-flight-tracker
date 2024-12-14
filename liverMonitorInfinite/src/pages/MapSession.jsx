import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import '@maptiler/sdk/dist/maptiler-sdk.css';
import "./MapSession.css";
import ZuluClock from '../components/ZuluClock';
import ApiService from '../components/ApiService';
import { useOutletContext } from 'react-router-dom';

const MapSession = () => {
  const { sessionId, onIconClick } = useOutletContext();
  const mapContainer = useRef(null);
  const map = useRef();
  const markers = useRef([]);
  const [currentPolyline, setCurrentPolyline] = useState([]);
  const [flightPlanPolyline, setFlightPlanPolyline] = useState([]);
  

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const flightData = await ApiService.getFlightData(sessionId);

        // Remove existing markers
        markers.current.forEach(marker => marker.remove());
        markers.current = [];

        // Process each flight data
        flightData.forEach(flight => {
          const { latitude, longitude, heading, flightId } = flight;

          const el = document.createElement('div');
          el.className = 'airplane-icon';
          el.addEventListener('click', async () => {
            // Remove existing polyline layers
            removePolylines();

            onIconClick(flight);

            try {
              // Fetch and render route polyline
              const route = await ApiService.getRoute(sessionId, flightId);
              if (route) {
                let coordinates = route.map(point => [point.longitude, point.latitude]);

                // Add current position as the last point
                coordinates.push([longitude, latitude]);

                // Correct for the International Date Line
                const correctedCoordinates = splitLineAtDateLine(coordinates);

                // Add route polyline
                const newPolyline = [];
                correctedCoordinates.forEach((segment, index) => {
                  const layerId = `flight-route-segment-${index}`;
                  map.current.addSource(layerId, {
                    type: 'geojson',
                    data: {
                      type: 'Feature',
                      geometry: {
                        type: 'LineString',
                        coordinates: segment,
                      }
                    }
                  });

                  map.current.addLayer({
                    id: layerId,
                    type: 'line',
                    source: layerId,
                    paint: {
                      'line-color': '#0000FF',
                      'line-width': 2,
                    }
                  });
                  newPolyline.push(layerId);
                });

                setCurrentPolyline(newPolyline);
              }

              // Fetch and render flight plan polyline
              const flightPlan = await ApiService.getFlightPlan(sessionId, flightId);
              if (flightPlan && flightPlan.result && flightPlan.result.flightPlanItems) {
                const flightPlanCoordinates = extractCoordinates(flightPlan.result.flightPlanItems);

                if (flightPlanCoordinates.length > 0) {
                  // Correct for the International Date Line
                  const correctedFlightPlanCoordinates = splitLineAtDateLine(flightPlanCoordinates);

                  // Add flight plan polyline
                  const newFlightPlanPolyline = [];
                  correctedFlightPlanCoordinates.forEach((segment, index) => {
                    const layerId = `flight-plan-route-segment-${index}`;
                    map.current.addSource(layerId, {
                      type: 'geojson',
                      data: {
                        type: 'Feature',
                        geometry: {
                          type: 'LineString',
                          coordinates: segment,
                        }
                      }
                    });

                    map.current.addLayer({
                      id: layerId,
                      type: 'line',
                      source: layerId,
                      paint: {
                        'line-color': 'black',
                        'line-width': 1,
                        'line-dasharray': [4, 2],
                      }
                    });
                    newFlightPlanPolyline.push(layerId);
                  });

                  setFlightPlanPolyline(newFlightPlanPolyline);
                } else {
                  console.error('No coordinates found in flight plan.');
                }
              } else {
                console.error('Flight plan is empty or malformed.');
              }
            } catch (error) {
              console.error('Error fetching route or flight plan:', error);
            }
          });

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([longitude, latitude])
            .addTo(map.current);

          marker.setRotation(heading);
          markers.current.push(marker);
        });
      } catch (error) {
        console.error('Error fetching flight data:', error);
      }
    };

    if (!map.current && mapContainer.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: "https://api.maptiler.com/maps/basic/style.json?key=oLMznTPIDCPrc3mGZdoh",
        center: [0, 0],
        zoom: 2,
      });

      // Add click event to map to clear polyline layers
      map.current.on('click', () => {
        removePolylines();
      });
    }

    fetchFlights();
    const intervalId = setInterval(fetchFlights, 30000);
    return () => clearInterval(intervalId);
  }, [sessionId, onIconClick]);

  // Function to remove existing polylines
  const removePolylines = () => {
    if (currentPolyline.length > 0) {
      currentPolyline.forEach((layerId) => {
        if (map.current.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
        if (map.current.getSource(layerId)) {
          map.current.removeSource(layerId);
        }
      });
      setCurrentPolyline([]);
    }

    if (flightPlanPolyline.length > 0) {
      flightPlanPolyline.forEach((layerId) => {
        if (map.current.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
        if (map.current.getSource(layerId)) {
          map.current.removeSource(layerId);
        }
      });
      setFlightPlanPolyline([]);
    }
  };

  // Function to split the line at the International Date Line
  const splitLineAtDateLine = (points) => {
    let splitLines = [];
    let currentLine = [points[0]];

    for (let i = 1; i < points.length; i++) {
      const [prevLng, prevLat] = currentLine[currentLine.length - 1];
      const [currentLng, currentLat] = points[i];

      if (Math.abs(currentLng - prevLng) > 180) {
        const adjustedLng = currentLng > 0 ? currentLng - 360 : currentLng + 360;
        currentLine.push([adjustedLng, currentLat]);
        splitLines.push(currentLine);
        currentLine = [[currentLng, currentLat]];
      } else {
        currentLine.push([currentLng, currentLat]);
      }
    }

    splitLines.push(currentLine);
    return splitLines;
  };

  // Function to extract coordinates from flight plan items
  const extractCoordinates = (items) => {
    let coordinates = [];

    items.forEach(item => {
      if (item.location && item.location.latitude && item.location.longitude) {
        coordinates.push([item.location.longitude, item.location.latitude]);
      }

      if (item.children && item.children.length > 0) {
        item.children.forEach(child => {
          if (child.location && child.location.latitude && child.location.longitude) {
            coordinates.push([child.location.longitude, child.location.latitude]);
          }
        });
      }
    });

    return coordinates;
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div id="map" ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <ZuluClock />
    </div>
  );
};

export default MapSession;
