import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

const GEOJSON_URL = 'https://raw.githubusercontent.com/vatsimnetwork/vatspy-data-project/refs/heads/master/Boundaries.geojson';
const OPENAIP_URL = 'https://api.core.openaip.net/api/airspaces';

export const useAtcLayer = (map, atcData, sessionName, isMapLoaded, onAtcClick) => {
    const [boundariesGeoJson, setBoundariesGeoJson] = useState(null);
    const atcDataRef = useRef(atcData); 
    const openAipCache = useRef(new Map()); // Cache for OpenAIP features: ICAO -> Feature
    const fetchingSet = useRef(new Set());  // Track in-flight requests
    
    // Sync ref
    useEffect(() => {
        atcDataRef.current = atcData;
    }, [atcData]);

    // Fetch VATSpy GeoJSON once
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

        const fetchOpenAIP = async (atc) => {
            const apiKey = import.meta.env.VITE_OPENAIP_KEY;
            
            // RESTRICTION: Only use OpenAIP for App (4), Dep (5), Center (6)
            if (!apiKey || ![4, 5, 6].includes(atc.type) || fetchingSet.current.has(atc.airportName)) return;

            fetchingSet.current.add(atc.airportName);
            
            try {
                // Search by Coordinate
                const response = await axios.get(OPENAIP_URL, {
                    params: {
                        apiKey,
                        pos: `${atc.latitude},${atc.longitude}`,
                        dist: 15000, 
                        limit: 20
                    }
                });

                if (response.data && response.data.items) {
                    const items = response.data.items;
                    let bestMatch = null;

                    // Helper to check keywords
                    const hasKeyword = (name, keywords) => keywords.some(k => name.toUpperCase().includes(k));

                    if (atc.type === 6) { // Center
                         // Prioritize FIR/UIR
                         bestMatch = items.find(i => hasKeyword(i.name, ['FIR', 'UIR', 'CENTER']));
                    }
                    else { // APP/DEP (4, 5)
                         // Prioritize TMA, CTR, CLASS B/C, TRACON
                         bestMatch = items.find(i => hasKeyword(i.name, ['TMA', 'CTA', 'TRACON', 'CLASS B', 'CLASS C', 'APPROACH', 'DEPARTURE']));
                    }

                    // Fallback: If we have multiple polygons, pick the largest one (likely the main airspace)
                    // (Simple heuristic: geometry size logic roughly via array length or just first regular polygon)
                    if (!bestMatch) {
                        bestMatch = items.find(i => i.geometry.type === 'Polygon' || i.geometry.type === 'MultiPolygon');
                    }

                    if (bestMatch) {
                        const feature = {
                            type: 'Feature',
                            geometry: bestMatch.geometry,
                            properties: {
                                id: atc.airportName,
                                color: '#0050b3', // Darker Blue for all OpenAIP results (App/Dep/Ctr)
                                source: 'OpenAIP',
                                name: bestMatch.name
                            }
                        };
                        openAipCache.current.set(atc.airportName, feature);
                        updateAtcLayer(); 
                    }
                }
            } catch (err) {
                console.warn(`OpenAIP fetch failed for ${atc.airportName}:`, err);
            } finally {
                fetchingSet.current.delete(atc.airportName);
            }
        };

        const updateAtcLayer = async () => {
            const isExpert = sessionName && sessionName.includes('Expert');
            
            if (!isExpert || !atcData) { 
                if (map.current.getSource('atc-boundaries')) {
                     map.current.getSource('atc-boundaries').setData({ type: 'FeatureCollection', features: [] });
                }
                return;
            }
      
            try {
              const activeAtc = atcData.filter(atc => [0, 1, 4, 5, 6].includes(atc.type));
              let allFeatures = [];
              const unmatchedAtc = [];
              
              // Z-Index Priority (Higher value = Drawn Later = On Top)
              // 0 (Gnd) > 1 (Twr) > 4/5 (App/Dep) > 6 (Ctr)
              const typePriority = {
                  0: 4, // Top
                  1: 3,
                  4: 2,
                  5: 2,
                  6: 1  // Bottom
              };
      
              // 1. VATSpy Data (Priority)
              if (boundariesGeoJson) {
                   const activeIcaos = activeAtc.map(a => a.airportName);
                   const matchedFeatures = boundariesGeoJson.features.filter(feature => {
                       return activeIcaos.includes(feature.properties.id); 
                   });
                   
                   const styledMatched = matchedFeatures.map(f => {
                       const original = activeAtc.find(a => a.airportName === f.properties.id);
                       const atcType = original ? original.type : 6;
                       return {
                           ...f,
                           properties: { 
                               ...f.properties, 
                               color: '#0050b3', 
                               className: 'FIR', 
                               source: 'VATSpy',
                               atcType: atcType
                           }
                       };
                   });
                   
                   allFeatures = [...styledMatched];
      
                   const matchedIds = matchedFeatures.map(f => f.properties.id);
                   activeAtc.forEach(atc => {
                       if (!matchedIds.includes(atc.airportName)) {
                           unmatchedAtc.push(atc);
                       }
                   });
              } else {
                  unmatchedAtc.push(...activeAtc);
              }
      
              // 2. Process Unmatched (OpenAIP Fallback -> Generated Circle)
              unmatchedAtc.forEach(atc => {
                  let feature = null;

                  // SPECFIC LOGIC: Ground (0) and Tower (1) ALWAYS use generated circles (Red)
                  if (atc.type === 0 || atc.type === 1) {
                      if (atc.latitude && atc.longitude) {
                          // Dynamic Sizing: Check if this airport also has APP (4) or DEP (5) active
                          const hasUpperLayer = activeAtc.some(a => 
                              a.airportName === atc.airportName && (a.type === 4 || a.type === 5)
                          );

                          // Base Radius
                          let radius = (atc.type === 1) ? 18520 : 5556; // Twr: ~10nm, Gnd: ~3nm
                          
                          // If parent layer exists, reduce radius to ensure it fits visually inside
                          // Reducing to 40% of original size ensures clear nesting
                          if (hasUpperLayer) {
                               radius = radius * 0.4; 
                          }

                          let color = (atc.type === 1) ? '#ff4d4d' : '#8b0000'; // Light vs Dark Red
                          
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
                          
                          feature = {
                              type: 'Feature',
                              geometry: { type: 'Polygon', coordinates: [ret] },
                              properties: {
                                  id: atc.airportName, 
                                  color: color,
                                  source: 'Generated',
                                  atcType: atc.type
                              }
                          };
                      }
                  } 
                  // LOGIC FOR APP (4), DEP (5), CENTER (6)
                  else {
                      // Check Cache FIRST
                      if (openAipCache.current.has(atc.airportName)) {
                          const cached = openAipCache.current.get(atc.airportName);
                          // Ensure cached feature also has atcType for sorting
                          feature = {
                              ...cached,
                              properties: { ...cached.properties, atcType: atc.type }
                          };
                      } else {
                          // Trigger Fetch if allowed type
                          if (import.meta.env.VITE_OPENAIP_KEY && [4, 5, 6].includes(atc.type)) {
                              fetchOpenAIP(atc);
                          }

                          // Create Default Circle while loading/if not found
                          if (atc.latitude && atc.longitude) {
                              let radius = 92600; 
                              let color = '#0050b3'; // Default Darker Blue
                              if (atc.type === 5) radius = 55560; // Dep smaller
                              
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
                              
                              feature = {
                                  type: 'Feature',
                                  geometry: { type: 'Polygon', coordinates: [ret] },
                                  properties: {
                                      id: atc.airportName || 'Unknown',
                                      color: color,
                                      source: 'Generated',
                                      atcType: atc.type
                                  }
                              };
                          }
                      }
                  }

                  if (feature) allFeatures.push(feature);
              });
              
              // 3. Sort Features for Z-Index
              allFeatures.sort((a, b) => {
                   const pA = typePriority[a.properties.atcType] || 0;
                   const pB = typePriority[b.properties.atcType] || 0;
                   return pA - pB; // Ascending: 1 (Bottom) to 4 (Top)
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

   // (Keep Click Listener logic same as before...)
    // Setup Click Listener
    useEffect(() => {
        if (!isMapLoaded || !map.current) return;
        const onMapClick = (e) => {
            if (e.features && e.features.length > 0) {
                // Get the TOP feature (because we sorted them by Z-Index, this is the one we want)
                const feature = e.features[0];
                const atcId = feature.properties.id; 
                const clickType = feature.properties.atcType; // Identify the specific layer clicked

                if (onAtcClick && atcDataRef.current) {
                    // Precise Find: Match BOTH id (airport) AND type
                    let clickedAtc = atcDataRef.current.find(a => 
                        a.airportName === atcId && a.type === clickType
                    );
                    
                    // Fallback: If for some reason type match fails (shouldn't if data consistent), try generic ID
                    if (!clickedAtc) {
                         clickedAtc = atcDataRef.current.find(a => a.airportName === atcId);
                    }

                    if (clickedAtc) onAtcClick(clickedAtc);
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
