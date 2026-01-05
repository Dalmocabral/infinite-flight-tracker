import { useEffect, useState } from 'react';
import { FaPlane, FaSearch } from 'react-icons/fa';
import { useAircraftDefinitions } from '../hooks/useAircraftDefinitions';
import './SearchWidget.css';

// Deduplicate flights based on flightId (or userId/username if flightId changes often)
// We also want to prioritize flights with active flight plans if possible.
const deduplicateFlights = (flights) => {
    const unique = new Map();
    flights.forEach(f => {
        if (!unique.has(f.username)) {
            unique.set(f.username, f);
        } else {
            // Keep the one with clearer data if duplicate
            // (e.g., has speed > 0 or altitude > 0)
            const existing = unique.get(f.username);
            if (f.speed > existing.speed) {
                unique.set(f.username, f);
            }
        }
    });
    return Array.from(unique.values());
};

const SearchWidget = ({ flightsData, onFlightSelect }) => {
    const [searchText, setSearchText] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    
    // Aircraft Definitions Hook
    const { data: aircraftDefs } = useAircraftDefinitions();

    useEffect(() => {
        if (!searchText.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        if (!flightsData) return;

        const lowerText = searchText.toLowerCase();
        
        // 1. Filter by Name
        const filtered = flightsData.filter(flight => 
            flight.username && flight.username.toLowerCase().includes(lowerText)
        );

        // 2. Deduplicate
        const uniqueFlights = deduplicateFlights(filtered);

        // 3. Sort (Optional - maybe by match relevance)
        // For now, raw list is okay.

        // Limit results
        setResults(uniqueFlights.slice(0, 10));
        setIsOpen(true);
    }, [searchText, flightsData]);

    const handleSelect = (flight) => {
        setSearchText(flight.username); // Keep selected name or clear? User asked for "clica e da um zoo", usually keeping name is nice feedback.
        setIsOpen(false);
        if (onFlightSelect) {
            onFlightSelect(flight);
        }
    };

    const getAircraftName = (id) => {
        // If we have a map
        if (aircraftDefs) {
             // Check if it's an object/map or array. 
             // Without seeing hook output, assuming it's a map based on typical usage.
             // If Array: find(a => a.id === id).name
             // If Map/Object: aircraftDefs[id]
             
             // Safer check if array
             if (Array.isArray(aircraftDefs)) {
                 const found = aircraftDefs.find(a => a.id === id);
                 return found ? found.name : id;
             }
             if (aircraftDefs[id]) return aircraftDefs[id];
        }
        return id; 
    };

    return (
        <div className="search-widget-container">
            <div className="search-input-wrapper">
                <FaSearch className="search-icon" />
                <input 
                    type="text" 
                    className="search-input"
                    placeholder="Search Pilot..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onFocus={() => searchText && setIsOpen(true)}
                />
            </div>

            {isOpen && results.length > 0 && (
                <div className="search-results-dropdown">
                    {results.map(flight => (
                        <div 
                            key={flight.flightId} 
                            className="search-result-item"
                            onClick={() => handleSelect(flight)}
                        >
                            <div className="result-header">
                                <span className="result-username">{flight.username || 'Unknown'}</span>
                                <span className="result-aircraft">
                                    <FaPlane style={{marginRight: '6px', fontSize: '0.7rem'}}/>
                                    {getAircraftName(flight.aircraftId)}
                                </span>
                            </div>
                            <div className="result-details">
                                <span className="result-route-text">
                                    {/* Try to show Route if available in flight object props, usually calling 'flightPlan' is needed which is async. 
                                        If the basic flight object doesn't have it, we might display 'N/A' or try to infer.
                                        Infinite Flight 'flight' object usually has 'callsign' but not always full route. 
                                        Let's rely on what we have. If ??? shows up, it means props are missing. 
                                    */}
                                    {flight.callsign ? `Callsign: ${flight.callsign}` : (flight.departureAirport ? `${flight.departureAirport} → ${flight.arrivalAirport}` : 'No Flight Plan')}
                                </span>
                                
                                <div className="result-stats">
                                    <span className="stat-item">{Math.round(flight.speed)}kts</span>
                                    <span className="stat-item">{Math.round(flight.altitude)}ft</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchWidget;
