import '@maptiler/sdk/dist/maptiler-sdk.css';
import axios from 'axios';
import maplibregl, { NavigationControl } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { useAtc } from '../hooks/useAtc';
import { useFlights } from '../hooks/useFlights';
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
  const [selectedFlightId, setSelectedFlightId] = useState(null);
  
  // React Query Hooks (Must be at the top)
  const { data: flightsData, error: flightsError } = useFlights(sessionId);
  const { data: atcData, error: atcError } = useAtc(sessionId);

  // State & Refs
  const [currentPolyline, setCurrentPolyline] = useState([]);
  const [boundariesGeoJson, setBoundariesGeoJson] = useState(null);
  const isDragging = useRef(false);
  const clickTimeout = useRef(null);

  // Helper to draw colored trajectory
  const updateTrajectory = async (flight) => {
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
                setCurrentPolyline([routeLayerId]);
            }
        }
      } catch (error) {
          console.error("Error updating trajectory:", error);
      }
  };

  // Trajectory Auto-Update Effect
  useEffect(() => {
     if (selectedFlightId && flightsData) {
         const flight = flightsData.find(f => f.flightId === selectedFlightId);
         if (flight) {
             updateTrajectory(flight);
         }
     }
  }, [flightsData, selectedFlightId]);

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



  // Marker Management (Diffing)
  useEffect(() => {
    if (!map.current || !flightsData) return;

    // Convert array to a Map for easier lookup by flightId
    const currentFlightsMap = new Map();
    flightsData.forEach(f => currentFlightsMap.set(f.flightId, f));
    
    // 1. UPDATE or REMOVE existing markers
    // markers.current should be a Map or Object storing flightId -> Marker instance
    // Currently it's an array. Let's change it to a MapRef.
    // NOTE: I need to change the useRef definition at the top of the file as well.
    // Assuming I will do that in a separate edit or handle it here if I could.
    // Since I can't change the ref definition in this specific block easily without ensuring the ref is initialized as a Map/Object.
    // Adaptation: treat markers.current as an Array but we really need an ID mapping.
    // Let's assume markers.current will be migrated to a Map: const markersMap = markers.current; (if it was initialized as one)
    // But it is currently initialized as array `const markers = useRef([]);`
    // I MUST Change the initialization logic too. 
    // I will use a local variable strategy here or better, I should probably do a view_file first to confirm I can change the init line?
    // I already have the view_file. Line 19: const markers = useRef([]);
    
    // To proceed safely without breaking, I will maintain markers.current as an object or Map.
    // Let's just override it: markers.current = {} where key is flightId.
    if (Array.isArray(markers.current)) {
        markers.current = {}; // Initialize as object if it was array
    }

    const activeIds = new Set();

    flightsData.forEach(flight => {
        activeIds.add(flight.flightId);
        const { latitude, longitude, heading, username, virtualOrganization, aircraftId, flightId } = flight;
        
        let marker = markers.current[flightId];

        if (marker) {
            // Update existing marker
            // MapLibre markers update position instantly. For CSS transition, we need to style the element.
            // The element is usually accessible via marker.getElement()
            const el = marker.getElement();
            if (el) {
                 el.style.transform = `rotate(${heading}deg)`;
                 // Add specific transition class if not present
                 if (!el.classList.contains('smooth-marker')) {
                     el.classList.add('smooth-marker');
                     el.style.transition = 'transform 0.5s linear, top 5s linear, left 5s linear'; // MapLibre uses transform translate usually
                     // Actually MapLibre updates the CSS transform (translate3d) of the marker container.
                     // The Marker.setLngLat() updates the internal position.
                 }
            }
            marker.setLngLat([longitude, latitude]);
            marker.setRotation(heading); // This rotates the element itself usually? No, setRotation rotates the marker.
        } else {
            // Create New Marker
            const el = document.createElement('div');
            const streamer = stremerData.find(st => st.username === username);
            const isStaff = staffData.some(staff => staff.username === username);
            const aircraft = dataSetIconAircraft.GA.find(ac => ac.id === aircraftId);

            el.className = 'airplane-icon smooth-marker'; // Add transition class
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

            // Note: rotation is handled by marker.setRotation or manual transform depending on set-up.
            // setRotation() is the proper MapLibre way.

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                removePolylines();
                onIconClick(flight);
                setSelectedFlightId(flight.flightId);
                updateTrajectory(flight); // Initial draw
            });

            const newMarker = new maplibregl.Marker({ element: el })
                .setLngLat([longitude, latitude])
                .setRotation(heading)
                .addTo(map.current);
            
            markers.current[flightId] = newMarker;
        }
    });

    // Remove Check
    Object.keys(markers.current).forEach(id => {
        if (!activeIds.has(id)) {
            markers.current[id].remove();
            delete markers.current[id];
        }
    });

  }, [flightsData, onIconClick]);

  // ATC Layer Effect - Runs when ATC data or Map updates
  useEffect(() => {
    const updateAtcLayer = async () => {
      // Limpa camadas se não for Expert Server ou se nao tiver dados
      const isExpert = sessionName && sessionName.includes('Expert');
      
      if (!isExpert || !atcData) { // Check atcData
        if (map.current && map.current.getSource('atc-boundaries')) {
             map.current.getSource('atc-boundaries').setData({ type: 'FeatureCollection', features: [] });
        }
        return;
      }

      try {
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
    
    updateAtcLayer();
  }, [atcData, boundariesGeoJson, sessionName]); // Depende do atcData, geojson e sessionName

  // Map Initialization Effect
  useEffect(() => {
    if (!map.current && mapContainer.current) {
        // Load persisted state
        const savedZoom = localStorage.getItem('mapZoom');
        const savedCenter = localStorage.getItem('mapCenter');
        
        const initialZoom = savedZoom ? parseFloat(savedZoom) : 2;
        const initialCenter = savedCenter ? JSON.parse(savedCenter) : [0, 0];

      const mapTilerKey = import.meta.env.VITE_MAPTILER_KEY;
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/basic/style.json?key=${mapTilerKey}`,
        center: initialCenter,
        zoom: initialZoom,
      });
      
      // Save state on move
      map.current.on('moveend', () => {
          const center = map.current.getCenter();
          const zoom = map.current.getZoom();
          localStorage.setItem('mapCenter', JSON.stringify([center.lng, center.lat]));
          localStorage.setItem('mapZoom', zoom.toString());
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
  }, [sessionId, onIconClick]); // Re-run if session changes (though typically map instance persists, we might want to handle session change better, but for now matching legacy behavior)
  
  // Remover polilinhas ao mudar de servidor
  useEffect(() => {
    if (map.current) {
      removePolylines();
    }
  }, [sessionId]);

  const removePolylines = () => {
    setSelectedFlightId(null); // Clear selection so it stops auto-updating

    // Clean History
    currentPolyline.forEach((layerId) => {
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
      
      if (layerId === 'flight-history-layer') {
          if (map.current.getSource('flight-history-source')) map.current.removeSource('flight-history-source');
      } else {
          if (map.current.getSource(layerId)) map.current.removeSource(layerId); 
      }
    });
    setCurrentPolyline([]);
  };


  // Função para desenrolar coordenadas para a Date Line (Unwrap)
  const unwrapCoordinates = (points) => {
    if (!points || points.length === 0) return [];
    
    let unwrapped = [[points[0][0], points[0][1]]];
    let showPrevLng = points[0][0];
    let offset = 0;

    for (let i = 1; i < points.length; i++) {
      const [currentLng, currentLat] = points[i];
      let diff = currentLng - showPrevLng;

      // Se o salto for muito grande, ajustamos o offset
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div id="map" ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <ZuluClock />
    </div>
  );
};

export default MapSession;
