import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

const GEOJSON_URL = 'https://raw.githubusercontent.com/vatsimnetwork/vatspy-data-project/refs/heads/master/Boundaries.geojson';

export const useAtcLayer = (map, atcData, sessionName, isMapLoaded, onAtcClick) => {
    const [boundariesGeoJson, setBoundariesGeoJson] = useState(null);
    const atcDataRef = useRef(atcData); // For click handler access
    
    // Sync ref
    useEffect(() => {
        atcDataRef.current = atcData;
    }, [atcData]);

    // Fetch GeoJSON once
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

    // ATC Update Effect
    useEffect(() => {
        if (!isMapLoaded || !map.current) return;

        // Initialize Source and Layers if missing
        if (!map.current.getSource('atc-boundaries')) {
            map.current.addSource('atc-boundaries', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            map.current.addLayer({
                id: 'atc-fill',
                type: 'fill',
                source: 'atc-boundaries',
                paint: {
                    'fill-color': ['get', 'color'],
                    'fill-opacity': 0.15
                }
            });

            map.current.addLayer({
                id: 'atc-outline',
                type: 'line',
                source: 'atc-boundaries',
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': 1
                }
            });
        }

        const updateAtcLayer = async () => {
            const isExpert = sessionName && sessionName.includes('Expert');
            
            if (!isExpert || !atcData) { // Check atcData
                if (map.current.getSource('atc-boundaries')) {
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
      
              if (map.current.getSource('atc-boundaries')) {
                  map.current.getSource('atc-boundaries').setData(dataToRender);
              }
            } catch (error) {
              console.error("Erro ao atualizar camadas ATC:", error);
            }
        };

        updateAtcLayer();
    }, [atcData, boundariesGeoJson, sessionName, isMapLoaded, map]);

    // Setup Click Listener
    useEffect(() => {
        if (!isMapLoaded || !map.current) return;

        const onMapClick = (e) => {
            if (e.features && e.features.length > 0) {
                const feature = e.features[0];
                const atcId = feature.properties.id; // Airport Name or ID
                
                if (onAtcClick && atcDataRef.current) {
                    // Find the full ATC object
                    const clickedAtc = atcDataRef.current.find(a => a.airportName === atcId);
                    if (clickedAtc) {
                        onAtcClick(clickedAtc);
                    }
                }
            }
        };

        const onMouseEnter = () => map.current.getCanvas().style.cursor = 'pointer';
        const onMouseLeave = () => map.current.getCanvas().style.cursor = '';

        map.current.on('click', 'atc-fill', onMapClick);
        map.current.on('mouseenter', 'atc-fill', onMouseEnter);
        map.current.on('mouseleave', 'atc-fill', onMouseLeave);

        return () => {
            if (map.current) {
                map.current.off('click', 'atc-fill', onMapClick);
                map.current.off('mouseenter', 'atc-fill', onMouseEnter);
                map.current.off('mouseleave', 'atc-fill', onMouseLeave);
            }
        };

    }, [isMapLoaded, map, onAtcClick]);
};
