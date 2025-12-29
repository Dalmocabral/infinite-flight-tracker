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

        // 1. Initialize Source if missing
        if (!map.current.getSource('atc-boundaries')) {
            map.current.addSource('atc-boundaries', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }

        // 2. Initialize or Update Layers
        // We separate this check to handle Hot Reloading or subsequent re-runs where source exists but new layers map not
        
        // Layer: ATC Fill
        if (!map.current.getLayer('atc-fill')) {
            map.current.addLayer({
                id: 'atc-fill',
                type: 'fill',
                source: 'atc-boundaries',
                paint: {
                    'fill-color': ['get', 'color'],
                    'fill-opacity': 0.15
                },
                filter: ['!=', ['get', 'type'], 'STAR']
            });
        } else {
             // Ensure filter is up to date (hot fix)
             map.current.setFilter('atc-fill', ['!=', ['get', 'type'], 'STAR']);
        }

        // Layer: ATC Outline
        if (!map.current.getLayer('atc-outline')) {
             map.current.addLayer({
                id: 'atc-outline',
                type: 'line',
                source: 'atc-boundaries',
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': 1
                },
                filter: ['!=', ['get', 'type'], 'STAR']
            });
        } else {
             map.current.setFilter('atc-outline', ['!=', ['get', 'type'], 'STAR']);
        }

        // Layer: STAR Fill
        if (!map.current.getLayer('atc-star-fill')) {
            map.current.addLayer({
                id: 'atc-star-fill',
                type: 'fill',
                source: 'atc-boundaries',
                filter: ['==', ['get', 'type'], 'STAR'],
                paint: {
                    'fill-color': '#FFEE58', // Lighter Yellow
                    'fill-opacity': 0.6
                }
            });
        }

        // Layer: STAR Outline
        if (!map.current.getLayer('atc-star-outline')) {
            map.current.addLayer({
                id: 'atc-star-outline',
                type: 'line',
                source: 'atc-boundaries',
                filter: ['==', ['get', 'type'], 'STAR'],
                paint: {
                    'line-color': '#000000', // Black outline
                    'line-width': 1.5
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

                    // Fallback: If we have multiple polygons, pick the largest one
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

              // Detect Fully Staffed Airports (Ground + Tower)
              const airportStaffing = new Map(); // ICAO -> Set(Types)
              activeAtc.forEach(atc => {
                  if (!airportStaffing.has(atc.airportName)) {
                      airportStaffing.set(atc.airportName, new Set());
                  }
                  airportStaffing.get(atc.airportName).add(atc.type);
              });
              
              // Z-Index Priority
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
                          // Dynamic Sizing
                          const hasUpperLayer = activeAtc.some(a => 
                              a.airportName === atc.airportName && (a.type === 4 || a.type === 5)
                          );

                          // Base Radius
                          let radius = (atc.type === 1) ? 18520 : 5556; // Twr: ~10nm, Gnd: ~3nm
                          
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
              
              // 3. GENERATE STARS (Gnd + Twr)
              airportStaffing.forEach((types, icao) => {
                  if (types.has(0) && types.has(1)) { // Has Ground AND Tower
                       // Find coordinates from the Tower entry (usually more reliable or same)
                       const refAtc = activeAtc.find(a => a.airportName === icao && a.type === 1);
                       
                       if (refAtc && refAtc.latitude && refAtc.longitude) {
                           // SCALE FIX: Check if there is an Upper Layer (APP/DEP)
                           const hasUpperLayer = activeAtc.some(a => 
                               a.airportName === icao && (a.type === 4 || a.type === 5)
                           );

                           let radiusMeters = 18520; // 10nm
                           if (hasUpperLayer) {
                               radiusMeters = radiusMeters * 0.4; // Scale down if nested like the circle
                           }

                           const km = radiusMeters / 1000;
                           const innerFactor = 0.2; // 20% inner radius for star spikes

                           const distanceX = km / (111.32 * Math.cos((refAtc.latitude * Math.PI) / 180));
                           const distanceY = km / 110.574;
                           
                           const starCoords = [];
                           const points = 4;
                           
                           for (let i = 0; i < points * 2; i++) {
                               const isOuter = i % 2 === 0;
                               const r = isOuter ? 1.0 : innerFactor;
                               
                               const theta = (i * Math.PI) / points; 
                               
                               const x = (distanceX * r) * Math.cos(theta);
                               const y = (distanceY * r) * Math.sin(theta);
                               
                               starCoords.push([refAtc.longitude + x, refAtc.latitude + y]);
                           }
                           starCoords.push(starCoords[0]); // Close

                           allFeatures.push({
                               type: 'Feature',
                               geometry: { type: 'Polygon', coordinates: [starCoords] },
                               properties: {
                                   id: icao,
                                   type: 'STAR',
                                   atcType: 999,
                                   color: '#FFEE58' // Fallback color
                               }
                           });
                       }
                  }
              });

              // 4. Sort Features for Z-Index
              allFeatures.sort((a, b) => {
                   // STARs (999) should be on TOP
                   const pA = a.properties.atcType === 999 ? 999 : (typePriority[a.properties.atcType] || 0);
                   const pB = b.properties.atcType === 999 ? 999 : (typePriority[b.properties.atcType] || 0);
                   return pA - pB; 
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
                const atcId = feature.properties.id; 
                let clickType = feature.properties.atcType; 

                // If Star clicked, treat as Tower (type 1) or decide logic
                // Usually we want to open Tower frequency
                if (feature.properties.type === 'STAR') {
                    clickType = 1; 
                }

                if (onAtcClick && atcDataRef.current) {
                    
                    let clickedAtc = atcDataRef.current.find(a => 
                        a.airportName === atcId && a.type === clickType
                    );
                    
                    if (!clickedAtc) {
                         // Fallback generally to any active frequency for that airport
                         clickedAtc = atcDataRef.current.find(a => a.airportName === atcId);
                    }

                    if (clickedAtc) {
                        onAtcClick(clickedAtc);
                        if (e.originalEvent) {
                            e.originalEvent.stopPropagation();
                        }
                    }
                }
            }
        };
        const onMouseEnter = () => map.current.getCanvas().style.cursor = 'pointer';
        const onMouseLeave = () => map.current.getCanvas().style.cursor = '';
        
        // Listen Open layers
        map.current.on('click', 'atc-fill', onMapClick);
        map.current.on('click', 'atc-star-fill', onMapClick); // Listen to Star too

        map.current.on('mouseenter', 'atc-fill', onMouseEnter);
        map.current.on('mouseenter', 'atc-star-fill', onMouseEnter);

        map.current.on('mouseleave', 'atc-fill', onMouseLeave);
        map.current.on('mouseleave', 'atc-star-fill', onMouseLeave);

        return () => {
            if (map.current) {
                map.current.off('click', 'atc-fill', onMapClick);
                map.current.off('click', 'atc-star-fill', onMapClick);

                map.current.off('mouseenter', 'atc-fill', onMouseEnter);
                map.current.off('mouseenter', 'atc-star-fill', onMouseEnter);

                map.current.off('mouseleave', 'atc-fill', onMouseLeave);
                map.current.off('mouseleave', 'atc-star-fill', onMouseLeave);
            }
        };
    }, [isMapLoaded, map, onAtcClick]);
};
