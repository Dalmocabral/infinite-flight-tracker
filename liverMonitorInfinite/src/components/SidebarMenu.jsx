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

const { Sider } = Layout;

// Define server sessions
// Define as sessões dos servidores
const sessions = {
  training: { id: '15f884a5-52ec-467e-bda5-414d4569544d', name: 'Training Server' }, // version 24.4
  casual: { id: '1f5ff830-8e4d-4477-89e7-21c136d54844', name: 'Casual Server' }, // version 24.4
  expert: { id: 'ed323139-baa7-4834-b9d6-5fb9f19ff11e', name: 'Expert Server' } // version 24.4
};

export const SidebarMenu = () => {
  // State for the selected server
  // Estado para o servidor selecionado
  const [selectedServer, setSelectedServer] = useState('expert');

  // Hoisted Data Hooks (Shared between Map and Pilots List)
  const { data: flightsData } = useFlights(sessions[selectedServer].id);
  const { data: atcData } = useAtc(sessions[selectedServer].id);
  
  // State for sidebar visibility
  // Estado para a visibilidade da barra lateral
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // State for user sidebar visibility
  // Estado para a visibilidade da barra lateral do usuário
  const [userSidebarVisible, setUserSidebarVisible] = useState(false);

  // State for ATC sidebar visibility
  const [atcSidebarVisible, setAtcSidebarVisible] = useState(false);

  // State for Pilots sidebar visibility
  const [pilotsSidebarVisible, setPilotsSidebarVisible] = useState(false);

  // State for selected flight
  // Estado para o voo selecionado
  const [selectedFlight, setSelectedFlight] = useState(null);

  // State for selected ATC
  const [selectedAtc, setSelectedAtc] = useState(null);

  // Ref for the UserInfoSidebar to detect outside clicks
  // Referência para a UserInfoSidebar para detectar cliques fora do componente
  const userSidebarRef = useRef(null);
  
  // Ref for ATC Sidebar
  const atcSidebarRef = useRef(null);

  // Ref for Pilots Sidebar (No longer needed for Dialog)
  // const pilotsSidebarRef = useRef(null);

  // Handles server selection
  // Manipula a seleção do servidor
  const handleSelectServer = (serverKey) => {
    setSelectedServer(serverKey);
  };

  // Handles map icon click to show flight details
  // Manipula o clique no ícone do mapa para mostrar os detalhes do voo
  const handleMapIconClick = (flight) => {
    setSelectedFlight(flight);
    setUserSidebarVisible(true);
    setAtcSidebarVisible(false);
    setSidebarVisible(false); // Hide Session Sidebar on selection
    setPilotsSidebarVisible(false); // Hide Pilots list if selecting from map
  };

  const handleAtcClick = (atc) => {
      setSelectedAtc(atc);
      setAtcSidebarVisible(true);
      setUserSidebarVisible(false); // Close user/flight if open
      setSidebarVisible(false); // Hide Session Sidebar on selection
      setPilotsSidebarVisible(false);
  };

  const handleSelectPilot = (flight) => {
      // Called when clicking a pilot in the list
      setSelectedFlight(flight);
      setUserSidebarVisible(true);
      setPilotsSidebarVisible(false); // Close list, show user info
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
          setSidebarVisible(false); // Hide others
          setUserSidebarVisible(false);
          setAtcSidebarVisible(false);
      }
  };

  // Detects clicks outside the UserInfoSidebar and hides it
  // Detecta cliques fora do UserInfoSidebar e o oculta
  const handleClickOutside = (event) => {
    // If clicking outside User Sidebar while it is open
    if (userSidebarVisible && userSidebarRef.current && !userSidebarRef.current.contains(event.target)) {
      setUserSidebarVisible(false);
      setSidebarVisible(true); // Restore Session Sidebar
    }
    
    // If clicking outside ATC Sidebar while it is open
    if (atcSidebarVisible && atcSidebarRef.current && !atcSidebarRef.current.contains(event.target)) {
       setAtcSidebarVisible(false);
       setSidebarVisible(true); // Restore Session Sidebar
    }

    // Pilots Dialog handles its own backdrop click via onClose
  };

  

  // Toggles the visibility of the SessionInfoSidebar
  // Alterna a visibilidade do SessionInfoSidebar
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // Adds an event listener to detect outside clicks
  // Adiciona um listener de eventos para detectar cliques fora do componente
  // Adds an event listener to detect outside clicks
  // Adiciona um listener de eventos para detectar cliques fora do componente
  React.useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [userSidebarVisible, atcSidebarVisible, sidebarVisible, pilotsSidebarVisible]); // Add dependencies to keep closure fresh

  // Ref for Map Actions
  const mapActions = useRef(null);

  const handleMapReady = (actions) => {
    mapActions.current = actions;
  };

  const handleAirportSelect = (lat, lon) => {
    if (mapActions.current && mapActions.current.flyTo) {
      mapActions.current.flyTo(lat, lon, 12);
      // Optional: Close sidebar on mobile? Keep open for now.
    }
  };

  return (
    <Layout>
      {/* Sidebar with logo and menu list */}
      {/* Barra lateral com logo e lista de menus */}
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
          
          {/* Sidebar Content Container - Static Width to prevent Map Blink */}
          <div 
             className="sidebar-content-wrapper" 
             style={{ 
                width: (sidebarVisible || userSidebarVisible || atcSidebarVisible || pilotsSidebarVisible) ? '350px' : '0px',
                transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden',
                flexShrink: 0,
                position: 'relative',
                background: '#161616', /* Dark background to prevent white flash */
                height: '100vh'
             }}
          >
              {/* Session Info Sidebar */}
              {sidebarVisible && (
                <SessionInfoSidebar
                  sessionName={sessions[selectedServer].name}
                  sessionId={sessions[selectedServer].id}
                  onAirportSelect={handleAirportSelect}
                />
              )}

              {/* User Info Sidebar */}
              {userSidebarVisible && selectedFlight && (
                <UserInfoSidebar 
                  ref={userSidebarRef} 
                  isVisible={userSidebarVisible} 
                  flightData={selectedFlight} 
                  sessionId={sessions[selectedServer].id} 
                />
              )}

              {/* ATC Info Sidebar */}
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

              {/* Pilots Sidebar removed from here */}
          </div>
          
          {/* Map session component (Fills remaining space) */}
          <MapSession 
            sessionId={sessions[selectedServer].id} 
            sessionName={sessions[selectedServer].name}
            onIconClick={handleMapIconClick} 
            onAtcClick={handleAtcClick}
            onMapReady={handleMapReady}
            flightsDataProp={flightsData} // Pass fetched data
            atcDataProp={atcData}         // Pass fetched data
          />

           {/* Pilots Sidebar (Dialog) */}
           {pilotsSidebarVisible && (
              <PilotsSidebar 
                  isVisible={pilotsSidebarVisible}
                  flightsData={flightsData}
                  onSelectFlight={handleSelectPilot}
                  onClose={togglePilotsSidebar} // Pass close handler
                  selectedFlightId={selectedFlight ? selectedFlight.flightId : null}
              /> 
          )}
        </div>
      </Layout>
    </Layout>
  );
};

export default SidebarMenu;
