import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import '@maptiler/sdk/dist/maptiler-sdk.css';
import "./MapSession.css";
import ZuluClock from './ZuluClock';
import ApiService from './ApiService';

const MapSession = ({ sessionId, onIconClick }) => {
  const mapContainer = useRef(null);
  const map = useRef();
  const markers = useRef([]);
  const [currentPolyline, setCurrentPolyline] = useState([]);
  const [flightPlanPolyline, setFlightPlanPolyline] = useState([]);

  // Recuperar dados salvos localmente
  const savedUsername = localStorage.getItem('formUsername'); // Nome do usuário salvo
  const savedVAName = localStorage.getItem('vaName'); // Nome da VA salvo (opcional)
  console.log('O nome que está retornado do localStorage: ', savedUsername);
  console.log('VA/VO retornado do localStorage: ', savedVAName);

  useEffect(() => {


    const fetchFlights = async () => {
      try {
        const flightData = await ApiService.getFlightData(sessionId);

        // Remove existing markers
        markers.current.forEach(marker => marker.remove());
        markers.current = [];

        // Process each flight data
        flightData.forEach(flight => {
          const { latitude, longitude, heading, username, virtualOrganization } = flight;

          const el = document.createElement('div');

          // Verifica se o usuário está online e retorna o ícone apropriado
          if (!username || username === null) {
            el.className = 'airplane-icon'; // Ícone padrão para usuários offline ou nulos
          } else if (username === savedUsername) {
            el.className = 'special-airplane-icon'; // Ícone especial para o usuário atual
          } else if (virtualOrganization && virtualOrganization === savedVAName) {
            el.className = 'va-airplane-icon'; // Ícone especial para a VA do usuário
          } else {
            el.className = 'airplane-icon'; // Ícone padrão para outros casos
          }

          // Rotacionar o ícone com base no heading
          el.style.transform = `rotate(${heading}deg)`;

          el.addEventListener('click', async () => {
            // Remove existing polyline layers
            removePolylines();

            onIconClick(flight);

            try {
              // Fetch and render route polyline
              const route = await ApiService.getRoute(sessionId, flight.flightId);
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
            } catch (error) {
              console.error('Error fetching route:', error);
            }
          });

          // Cria o marcador no mapa
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

      // Adicionar evento de clique no mapa para limpar polylines
      map.current.on('click', () => {
        removePolylines();
      });
    }

    fetchFlights();
    const intervalId = setInterval(fetchFlights, 30000);
    return () => clearInterval(intervalId);
  }, [sessionId, onIconClick]);

  // Função para remover polylines
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

  // Função para dividir linha na linha internacional de mudança de data
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div id="map" ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <ZuluClock />
    </div>
  );
};

export default MapSession;
