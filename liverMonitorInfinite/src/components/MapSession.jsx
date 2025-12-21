import '@maptiler/sdk/dist/maptiler-sdk.css';
import { useEffect, useRef, useState } from "react";
import { useAircraftMarkers } from '../hooks/map/useAircraftMarkers';
import { useAtcLayer } from '../hooks/map/useAtcLayer';
import { useMap } from '../hooks/map/useMap';
import { useTrajectory } from '../hooks/map/useTrajectory';
import { useAtc } from '../hooks/useAtc';
import { useFlights } from '../hooks/useFlights';
import "./MapSession.css";
import ZuluClock from './ZuluClock';

// JSON imports are now handled inside the hooks where needed, 
// but we might need to pass savedUsername/savedVAName if we want to keep the component pure.
// Currently useAircraftMarkers takes them as args.

const MapSession = ({ sessionId, sessionName, onIconClick, onAtcClick }) => {
  const mapContainer = useRef(null);
  const [selectedFlightId, setSelectedFlightId] = useState(null);
  
  // 1. Data Hooks
  const { data: flightsData } = useFlights(sessionId);
  const { data: atcData } = useAtc(sessionId);

  // 2. Map Initialization Hook
  const { map, isMapLoaded } = useMap(mapContainer);

  // 3. Trajectory Hook
  const { updateTrajectory, updateTrajectoryLocal, removePolylines } = useTrajectory(
      map, 
      sessionId, 
      selectedFlightId, 
      flightsData
  );

  // 4. Aircraft Markers & Animation Hook
  const savedUsername = localStorage.getItem('formUsername');
  const savedVAName = localStorage.getItem('vaName');

  useAircraftMarkers(
      map, 
      flightsData, 
      onIconClick, 
      savedUsername, 
      savedVAName, 
      removePolylines, 
      setSelectedFlightId, 
      updateTrajectory,
      updateTrajectoryLocal // Pass callback for sync update
  );

  // 5. ATC Layer Hook
  useAtcLayer(map, atcData, sessionName, isMapLoaded, onAtcClick);

  // 6. Global Map Click Logic for Clearing Selection
  // Note: logic moved to inside useAircraftMarkers ? No, useAircraftMarkers handles marker clicks.
  // We need the background click logic. 
  // We can add it here or in useMap. 
  // Since it depends on 'removePolylines' from useTrajectory, it's safer here.
  
  // Actually, useMap shouldn't know about polylines.
  // useTrajectory provides removePolylines. 
  // Let's add the click listener here using useEffect.
  
  const clickListenerAdded = useRef(false);
  
  useRef(() => {
     // This effect is tricky because 'removePolylines' might change? 
     // Ideally it shouldn't provided useTrajectory uses refs.
  });

  // Re-implementing the simple click listener for background clearing
  // Since 'map' ref is stable, we can set this up once map is loaded
  // But strictly speaking, we want to attach it once.
  
  // EDIT: I realized I removed the background click logic from the hooks to keep them focused.
  // I will add it here.
  

  
  useEffect(() => {
      if (!isMapLoaded || !map.current) return;
      
      const onMapClick = (e) => {
          if (e.defaultPrevented) return;
          removePolylines();
      };

      map.current.on('click', onMapClick);
      
      return () => {
          if (map.current) {
               map.current.off('click', onMapClick);
          }
      };
  }, [isMapLoaded, map, removePolylines]);


  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div id="map" ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <ZuluClock />
    </div>
  );
};

export default MapSession;
