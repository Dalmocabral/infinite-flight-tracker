import { useEffect, useRef, useState } from 'react';
import ApiService from '../components/ApiService';
import { useAirportStatus } from './useAirportStatus';

const CACHE_KEY = 'IF_AIRPORT_CACHE';

export const useSmartUnicomData = (sessionId, atcData) => {
    const { data: airportStatus } = useAirportStatus(sessionId);
    const [smartUnicomAirports, setSmartUnicomAirports] = useState([]);
    
    // Initial Load Cache from LocalStorage
    const airportCache = useRef(new Map());

    // Queue for sequential processing
    const queueRef = useRef([]);
    const isProcessingRef = useRef(false);
    const fetchingSet = useRef(new Set()); // In-memory duplicate check

    // Load cache once on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(CACHE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Convert object back to Map for easier lookup
                Object.entries(parsed).forEach(([icao, coords]) => {
                    airportCache.current.set(icao, coords);
                });
            }
        } catch (e) {
            console.error("Failed to load airport cache", e);
        }
    }, []);

    // Save cache to LocalStorage function
    const saveCache = () => {
        try {
            const obj = Object.fromEntries(airportCache.current);
            localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
        } catch (e) {
            console.warn("Failed to save airport cache", e);
        }
    };

    useEffect(() => {
        if (!airportStatus) return;

        const processSmartUnicom = async () => {
            const activeAtcMap = new Set(atcData ? atcData.map(a => a.airportName) : []);
            
            // 1. Filter airports that need Smart Unicom (Traffic > 0 AND No active ATC)
            const candidates = airportStatus.filter(status => {
                const hasTraffic = ((status.inboundFlightsCount || 0) > 0) || ((status.outboundFlightsCount || 0) > 0);
                const hasAtc = activeAtcMap.has(status.airportIcao);
                return hasTraffic && !hasAtc;
            });
            
            console.log(`[SmartUnicom] Status Count: ${airportStatus.length}, Candidates (Traffic + NoATC): ${candidates.length}`);

            const resolvedAirports = [];
            const toQueue = [];

            // 2. Resolve Coordinates from Cache
            candidates.forEach(airport => {
                const icao = airport.airportIcao;
                if (airportCache.current.has(icao)) {
                    const coords = airportCache.current.get(icao);
                    resolvedAirports.push({ ...airport, ...coords });
                } else {
                    // Only add to queue if not already fetching or queued
                    if (!fetchingSet.current.has(icao)) {
                        toQueue.push(icao);
                        fetchingSet.current.add(icao); 
                    }
                }
            });

            // Update state with what we have immediately
            if (resolvedAirports.length > 0) {
                 console.log(`[SmartUnicom] Setting ${resolvedAirports.length} cached airports.`);
                 setSmartUnicomAirports(resolvedAirports);
            }

            // 3. Add to Queue and Start Processing
            if (toQueue.length > 0) {
                 console.log(`[SmartUnicom] Queueing ${toQueue.length} airports for fetching.`);
                 
                 // Sort queue by traffic volume (optional but good idea)
                 toQueue.sort((aIcao, bIcao) => {
                     const a = candidates.find(c => c.airportIcao === aIcao);
                     const b = candidates.find(c => c.airportIcao === bIcao);
                     const aTraffic = (a?.inboundFlightsCount || 0) + (a?.outboundFlightsCount || 0);
                     const bTraffic = (b?.inboundFlightsCount || 0) + (b?.outboundFlightsCount || 0);
                     return bTraffic - aTraffic; // Descending
                 });

                 queueRef.current.push(...toQueue);
                 processQueue();
            }
        };

        processSmartUnicom();
    }, [airportStatus, atcData]);

    const processQueue = async () => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        while (queueRef.current.length > 0) {
            const icao = queueRef.current.shift(); // FIFO
            
            try {
                // Check cache AGAIN just in case (race condition or weird loop)
                if (airportCache.current.has(icao)) {
                     fetchingSet.current.delete(icao);
                     continue;
                }
                
                // console.log(`[SmartUnicom] Fetching info for ${icao}...`);
                const info = await ApiService.getAirportInfo(icao);
                
                if (info && info.latitude && info.longitude) {
                    console.log(`[SmartUnicom] GOT Coords for ${icao}: ${info.latitude}, ${info.longitude}`);
                    const coords = { latitude: info.latitude, longitude: info.longitude };
                    airportCache.current.set(icao, coords);
                    saveCache(); 

                    // Progressive Update: Add this new result to state
                    setSmartUnicomAirports(prev => {
                        if (prev.find(p => p.airportIcao === icao)) return prev;
                        return [...prev, { airportIcao: icao, ...coords }];
                    });
                } else {
                    console.warn(`[SmartUnicom] No Coords in info for ${icao}`, info);
                }
            } catch (err) {
                console.warn(`[SmartUnicom] Failed to fetch ${icao}`, err);
                // 429 Protection: Back off significantly
                if (err.response && err.response.status === 429) {
                     console.error("[SmartUnicom] Rate limit hit. Backing off for 10s.");
                     // Put back in queue? Or just skip?
                     // Let's put back at the END of queue
                     queueRef.current.push(icao); 
                     await new Promise(r => setTimeout(r, 10000));
                }
            } finally {
                fetchingSet.current.delete(icao);
            }

            // Strict Throttle: Wait 1 second between requests
            await new Promise(r => setTimeout(r, 1000));
        }

        isProcessingRef.current = false;
    };

    return { smartUnicomAirports };
};
