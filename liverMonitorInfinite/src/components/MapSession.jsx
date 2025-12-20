import '@maptiler/sdk/dist/maptiler-sdk.css';
import axios from 'axios';
import maplibregl, { NavigationControl } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import ApiService from './ApiService';
import dataSetIconAircraft from './dataSetIconAircraft.json';
import "./MapSession.css";
import staffData from './staff.json';
import stremerData from './stremer.json';
import ZuluClock from './ZuluClock';

const GEOJSON_URL = 'https://raw.githubusercontent.com/vatsimnetwork/vatspy-data-project/refs/heads/master/Boundaries.geojson';

const MapSession = ({ sessionId, sessionName, onIconClick }) => {
  const mapContainer = useRef(null);
  const map = useRef();
  const markers = useRef([]);
  const [currentPolyline, setCurrentPolyline] = useState([]);
  const [flightPlanPolyline, setFlightPlanPolyline] = useState([]);
  const [boundariesGeoJson, setBoundariesGeoJson] = useState(null);
  const isDragging = useRef(false);
  const clickTimeout = useRef(null);

  const savedUsername = localStorage.getItem('formUsername');
  const savedVAName = localStorage.getItem('vaName');

  useEffect(() => {
    const fetchBoundaries = async () => {
      try {
        const response = await axios.get(GEOJSON_URL);
        setBoundariesGeoJson(response.data);
      } catch (error) {
        console.error("Erro ao carregar Boundaries.geojson:", error);
      }
    };
    fetchBoundaries();
  }, []);

  // Função auxiliar para criar círculo (Raio em KM)
  const createGeoJSONCircle = (center, radiusInCm, points) => {
    if (!points) points = 64;
    const coords = {
      latitude: center[1],
      longitude: center[0]
    };
    const km = radiusInCm / 1000;
    const ret = [];
    const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
    const distanceY = km / 110.574;

    let theta, x, y;
    for (let i = 0; i < points; i++) {
        theta = (i / points) * (2 * Math.PI);
        x = distanceX * Math.cos(theta);
        y = distanceY * Math.sin(theta);
        ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]);
    return {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [ret]
        },
        properties: {
            id: 'generated-circle'
        }
    };
  };

  useEffect(() => {
    const updateAtcLayer = async () => {
      // Limpa camadas se não for Expert Server
      const isExpert = sessionName && sessionName.includes('Expert');
      
      if (!isExpert) {
        if (map.current && map.current.getSource('atc-boundaries')) {
             map.current.getSource('atc-boundaries').setData({ type: 'FeatureCollection', features: [] });
        }
        return;
      }

      try {
        const atcData = await ApiService.getAtcData(sessionId);
        // Tipos: 0=Ground, 1=Tower, 4=Approach, 5=Departure, 6=Center
        const activeAtc = atcData.filter(atc => [0, 1, 4, 5, 6].includes(atc.type));
        
        let allFeatures = [];
        const unmatchedAtc = [];

        // 1. Tenta encontrar no GeoJSON (Principalmente Centers/FIRs)
        if (boundariesGeoJson) {
             const activeIcaos = activeAtc.map(a => a.airportName);
             const matchedFeatures = boundariesGeoJson.features.filter(feature => {
                 return activeIcaos.includes(feature.properties.id); 
             });
             
             // Adiciona cor padrão AZUL para os encontrados no GeoJSON (geralmente Centers)
             const styledMatched = matchedFeatures.map(f => ({
                 ...f,
                 properties: { ...f.properties, color: '#0080ff', className: 'FIR' }
             }));
             
             allFeatures = [...styledMatched];

             // Identifica quais não foram encontrados para desenhar círculo
             const matchedIds = matchedFeatures.map(f => f.properties.id);
             activeAtc.forEach(atc => {
                 if (!matchedIds.includes(atc.airportName)) {
                     unmatchedAtc.push(atc);
                 }
             });
        } else {
            // Se GeoJSON não carregou, todos são unmatched
            unmatchedAtc.push(...activeAtc);
        }

        // 2. Para os não encontrados, gera círculos
        unmatchedAtc.forEach(atc => {
            if (atc.latitude && atc.longitude) {
                let radius = 92600; // Default
                let color = '#0080ff'; // Default Blue

                if (atc.type === 6) { radius = 92600; color = '#0080ff'; } // Center ~50nm
                if (atc.type === 4) { radius = 92600; color = '#0080ff'; } // Approach ~50nm
                if (atc.type === 5) { radius = 55560; color = '#0080ff'; } // Departure ~30nm
                
                // Novos tipos solicitados
                if (atc.type === 1) { radius = 18520; color = '#ff4d4d'; } // Tower ~10nm (Vermelho Claro)
                if (atc.type === 0) { radius = 5556; color = '#8b0000'; }  // Ground ~3nm (Vermelho Escuro)
                
                const km = radius / 1000;
                const ret = [];
                const distanceX = km / (111.32 * Math.cos((atc.latitude * Math.PI) / 180));
                const distanceY = km / 110.574;
                for (let i = 0; i < 64; i++) {
                    const theta = (i / 64) * (2 * Math.PI);
                    const x = distanceX * Math.cos(theta);
                    const y = distanceY * Math.sin(theta);
                    ret.push([atc.longitude + x, atc.latitude + y]);
                }
                ret.push(ret[0]);
                
                allFeatures.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [ret]
                    },
                    properties: {
                        id: atc.airportName || 'Unknown',
                        color: color
                    }
                });
            }
        });

        const dataToRender = {
            type: 'FeatureCollection',
            features: allFeatures
        };

        if (map.current && map.current.getSource('atc-boundaries')) {
            map.current.getSource('atc-boundaries').setData(dataToRender);
        }
      } catch (error) {
        console.error("Erro ao atualizar camadas ATC:", error);
      }
    };

    const fetchFlights = async () => {
      try {
        const flightData = await ApiService.getFlightData(sessionId);

        markers.current.forEach(marker => marker.remove());
        markers.current = [];

        flightData.forEach(flight => {
          const { latitude, longitude, heading, username, virtualOrganization, aircraftId } = flight;
          const el = document.createElement('div');
          const streamer = stremerData.find(st => st.username === username);
          const isStaff = staffData.some(staff => staff.username === username);
          const aircraft = dataSetIconAircraft.GA.find(ac => ac.id === aircraftId);

          if (!username || username === null) {
            el.className = 'airplane-icon';
          } else if (username === savedUsername) {
            el.className = 'special-airplane-icon';
          } else if (virtualOrganization && virtualOrganization === savedVAName) {
            el.className = 'va-airplane-icon';
          } else if (streamer && (streamer.twitch || streamer.youtube)) {
            el.className = 'online-airplane-icon';
          } else if (isStaff) {
            el.className = 'staff-airplane-icon';
          } else if (aircraft) {   
            el.className = 'custom-aircraft-icon';
          } else {
            el.className = 'airplane-icon';
          }

          el.style.transform = `rotate(${heading}deg)`;

          el.addEventListener('click', async (e) => {
            e.stopPropagation(); // Previne que o SidebarMenu feche imediatamente o painel
            removePolylines();
            onIconClick(flight);
            try {
              const route = await ApiService.getRoute(sessionId, flight.flightId);
              if (route && route.length > 0) {
                let coordinates = route.map(point => [point.longitude, point.latitude]);
                coordinates.push([longitude, latitude]);
                const correctedCoordinates = splitLineAtDateLine(coordinates);
                const newPolyline = [];
                correctedCoordinates.forEach((segment, index) => {
                  const layerId = `flight-route-segment-${index}`;
                  if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
                  if (map.current.getSource(layerId)) map.current.removeSource(layerId);
                  map.current.addSource(layerId, {
                    type: 'geojson',
                    data: { type: 'Feature', geometry: { type: 'LineString', coordinates: segment } }
                  });
                  map.current.addLayer({
                    id: layerId,
                    type: 'line',
                    source: layerId,
                    paint: { 'line-color': '#0000FF', 'line-width': 2 }
                  });
                  newPolyline.push(layerId);
                });
                setCurrentPolyline(newPolyline);
              }
            } catch (error) {}
          });

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([longitude, latitude])
            .addTo(map.current);
          marker.setRotation(heading);
          markers.current.push(marker);
        });
        
        // Update ATC Layer
        updateAtcLayer();

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

      const navControl = new NavigationControl();
      map.current.addControl(navControl, 'bottom-right');

      map.current.on('load', () => {
         // ATC Layers
         map.current.addSource('atc-boundaries', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
         });

         map.current.addLayer({
            id: 'atc-fill',
            type: 'fill',
            source: 'atc-boundaries',
            paint: {
                'fill-color': ['get', 'color'], // Usa a propriedade 'color' da feature
                'fill-opacity': 0.15
            }
         });

         map.current.addLayer({
            id: 'atc-outline',
            type: 'line',
            source: 'atc-boundaries',
            paint: {
                'line-color': ['get', 'color'], // Usa a propriedade 'color' da feature
                'line-width': 1
            }
         });
      });

      map.current.on('mousedown', () => {
        isDragging.current = false;
        if (clickTimeout.current) clearTimeout(clickTimeout.current);
      });

      map.current.on('mousemove', () => {
        isDragging.current = true;
      });

      map.current.on('mouseup', () => {
        if (!isDragging.current) {
          clickTimeout.current = setTimeout(() => {
            removePolylines();
          }, 50);
        }
        isDragging.current = false;
      });
    }

    if (map.current) {
        fetchFlights();
    }
    
    const intervalId = setInterval(fetchFlights, 30000);
    return () => clearInterval(intervalId);
  }, [sessionId, sessionName, onIconClick, boundariesGeoJson]);
  
  // Remover polilinhas ao mudar de servidor
  useEffect(() => {
    if (map.current) {
      removePolylines();
    }
  }, [sessionId]);

  const removePolylines = () => {
    currentPolyline.forEach((layerId) => {
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
      if (map.current.getSource(layerId)) map.current.removeSource(layerId);
    });
    setCurrentPolyline([]);
    flightPlanPolyline.forEach((layerId) => {
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
      if (map.current.getSource(layerId)) map.current.removeSource(layerId);
    });
    setFlightPlanPolyline([]);
  };


  // Função para dividir linha na Linha Internacional de Data
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
