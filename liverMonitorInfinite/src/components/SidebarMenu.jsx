import { Layout } from 'antd';
import React, { useRef, useState } from 'react';
import { useAtc } from '../hooks/useAtc'; // Import Hook
import { useFlights } from '../hooks/useFlights'; // Import Hook
import AtcInfoSidebar from './AtcInfoSidebar';
import Logo from './Logo';
import MapSession from './MapSession';
import Menulist from './Menulist';
import PilotsSidebar from './PilotsSidebar'; // Import New Sidebar
import SessionInfoSidebar from './SessionInfoSidebar';
import "./SidebarMenu.css";
import UserInfoSidebar from './UserInfoSidebar';

import { Spin } from 'antd'; // For loading state
import useInactivity from '../hooks/useInactivity'; // Import Hook
import { useSessions } from '../hooks/useSessions'; // Import Hook
import InactivityDialog from './InactivityDialog'; // Import Dialog


const { Sider } = Layout;

const SidebarMenu = () => {
  // Inactivity Logic (2 minutes = 120000ms)
  const { isInactive, handleReconnect } = useInactivity(120000);

  // Fetch Logic Dynamic Sessions
  const { data: sessions, isLoading: isLoadingSessions, error: sessionError } = useSessions();

  // State for the selected server
  const [selectedServer, setSelectedServer] = useState('expert');

  // Hoisted Data Hooks (Shared between Map and Pilots List)
  // Ensure sessions are loaded before fetching flights
  const currentSessionId = sessions && sessions[selectedServer] ? sessions[selectedServer].id : null;

  const { data: flightsData } = useFlights(currentSessionId, !isInactive && !!currentSessionId);
  const { data: atcData } = useAtc(currentSessionId, !isInactive && !!currentSessionId);
  
  // State definitions (moved UP before any return)
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [userSidebarVisible, setUserSidebarVisible] = useState(false);
  const [atcSidebarVisible, setAtcSidebarVisible] = useState(false);
  const [pilotsSidebarVisible, setPilotsSidebarVisible] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedAtc, setSelectedAtc] = useState(null);
  
  const userSidebarRef = useRef(null);
  const atcSidebarRef = useRef(null);

  // ... handlers ...

  const handleSelectServer = (serverKey) => {
    setSelectedServer(serverKey);
  };

  const handleMapIconClick = (flight) => {
    setSelectedFlight(flight);
    setUserSidebarVisible(true);
    setAtcSidebarVisible(false);
    setSidebarVisible(false); 
    setPilotsSidebarVisible(false); 
  };
  
  const handleAtcClick = (atc) => {
      setSelectedAtc(atc);
      setAtcSidebarVisible(true);
      setUserSidebarVisible(false); 
      setSidebarVisible(false); 
      setPilotsSidebarVisible(false);
  };

  const handleSelectPilot = (flight) => {
      setSelectedFlight(flight);
      setUserSidebarVisible(true);
      setPilotsSidebarVisible(false); 
      setSidebarVisible(false);
      setAtcSidebarVisible(false);

      if (mapActions.current && mapActions.current.flyTo) {
          mapActions.current.flyTo(flight.latitude, flight.longitude, 10);
      }
  };

  const togglePilotsSidebar = () => {
      if (pilotsSidebarVisible) {
          setPilotsSidebarVisible(false);
          setSidebarVisible(true);
      } else {
          setPilotsSidebarVisible(true);
          setSidebarVisible(false); 
          setUserSidebarVisible(false);
          setAtcSidebarVisible(false);
      }
  };

  const handleClickOutside = (event) => {
    if (userSidebarVisible && userSidebarRef.current && !userSidebarRef.current.contains(event.target)) {
      setUserSidebarVisible(false);
      setSidebarVisible(true); 
    }
    
    if (atcSidebarVisible && atcSidebarRef.current && !atcSidebarRef.current.contains(event.target)) {
       setAtcSidebarVisible(false);
       setSidebarVisible(true); 
    }
  };
  
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  React.useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [userSidebarVisible, atcSidebarVisible, sidebarVisible, pilotsSidebarVisible]); 

  const mapActions = useRef(null);

  const handleMapReady = (actions) => {
    mapActions.current = actions;
  };

  const handleAirportSelect = (lat, lon) => {
    if (mapActions.current && mapActions.current.flyTo) {
      mapActions.current.flyTo(lat, lon, 12);
    }
  };

  // CONDITIONAL RENDERING FOR LOADING/ERROR STATES
  if (isLoadingSessions) {
      return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000', color: '#fff' }}>
             <Spin size="large" tip="Loading Infinite Flight Servers..." />
          </div>
      );
  }

  if (sessionError || !sessions) {
      return <div style={{ color: 'red', padding: 20 }}>Error loading servers. Please refresh.</div>;
  }

  return (
    <Layout>
      <Sider className='sidebar' collapsed={true} collapsible={false}>
        <Logo />
        <Menulist 
            onSelectServer={handleSelectServer} 
            toggleSidebar={toggleSidebar} 
            togglePilotsSidebar={togglePilotsSidebar}
            flightsData={flightsData} 
        />
      </Sider>
      
      <Layout>
        <div style={{ display: 'flex', flexGrow: 1, position: 'relative' }}>
          
           <div 
              className="sidebar-content-wrapper" 
              style={{ 
                 width: (sidebarVisible || userSidebarVisible || atcSidebarVisible || pilotsSidebarVisible) ? '350px' : '0px',
                 transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                 overflow: 'hidden',
                 flexShrink: 0,
                 position: 'relative',
                 background: '#161616', 
                 height: '100vh'
              }}
           >
               {sidebarVisible && sessions[selectedServer] && (
                 <SessionInfoSidebar
                   sessionName={sessions[selectedServer].name}
                   sessionId={sessions[selectedServer].id}
                   onAirportSelect={handleAirportSelect}
                 />
               )}

               {userSidebarVisible && selectedFlight && (
                 <UserInfoSidebar 
                   ref={userSidebarRef} 
                   isVisible={userSidebarVisible} 
                   flightData={selectedFlight} 
                   sessionId={sessions[selectedServer].id} 
                 />
               )}

               {atcSidebarVisible && selectedAtc && (
                  <AtcInfoSidebar
                     ref={atcSidebarRef}
                     atc={selectedAtc}
                     sessionId={sessions[selectedServer].id}
                     onClose={() => {
                         setAtcSidebarVisible(false);
                         setSidebarVisible(true);
                     }}
                  />
               )}
           </div>
          
           <MapSession 
             sessionId={sessions[selectedServer].id} 
             sessionName={sessions[selectedServer].name}
             onIconClick={handleMapIconClick} 
             onAtcClick={handleAtcClick}
             onMapReady={handleMapReady}
             flightsDataProp={flightsData} 
             atcDataProp={atcData}         
           />

            {pilotsSidebarVisible && (
               <PilotsSidebar 
                   isVisible={pilotsSidebarVisible}
                   flightsData={flightsData}
                   onSelectFlight={handleSelectPilot}
                   onClose={togglePilotsSidebar} 
                   selectedFlightId={selectedFlight ? selectedFlight.flightId : null}
               /> 
           )}

           {/* Inactivity Dialog */}
           <InactivityDialog 
               open={isInactive} 
               onReconnect={handleReconnect} 
           />
        </div>
      </Layout>
    </Layout>
  );
};

export default SidebarMenu;
