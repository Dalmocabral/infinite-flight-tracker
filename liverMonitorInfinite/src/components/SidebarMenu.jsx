import React, { useState, useRef } from 'react';
import MapSession from './MapSession';
import Menulist from './Menulist';
import SessionInfoSidebar from './SessionInfoSidebar';
import UserInfoSidebar from './UserInfoSidebar';
import Logo from './Logo';
import { Layout } from 'antd';
import "./SidebarMenu.css";

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
  
  // State for sidebar visibility
  // Estado para a visibilidade da barra lateral
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // State for user sidebar visibility
  // Estado para a visibilidade da barra lateral do usuário
  const [userSidebarVisible, setUserSidebarVisible] = useState(false);

  // State for selected flight
  // Estado para o voo selecionado
  const [selectedFlight, setSelectedFlight] = useState(null);

  // Ref for the UserInfoSidebar to detect outside clicks
  // Referência para a UserInfoSidebar para detectar cliques fora do componente
  const userSidebarRef = useRef(null);

  // Handles server selection
  // Manipula a seleção do servidor
  const handleSelectServer = (serverKey) => {
    setSelectedServer(serverKey);
  };

  // Handles map icon click to show flight details
  // Manipula o clique no ícone do mapa para mostrar os detalhes do voo
  const handleMapIconClick = (flight) => {
    setSelectedFlight(flight); // Stores the selected flight / Armazena o voo selecionado
    setUserSidebarVisible(true);
  };

  // Detects clicks outside the UserInfoSidebar and hides it
  // Detecta cliques fora do UserInfoSidebar e o oculta
  const handleClickOutside = (event) => {
    if (userSidebarRef.current && !userSidebarRef.current.contains(event.target)) {
      setUserSidebarVisible(false);
    }
  };

  

  // Toggles the visibility of the SessionInfoSidebar
  // Alterna a visibilidade do SessionInfoSidebar
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // Adds an event listener to detect outside clicks
  // Adiciona um listener de eventos para detectar cliques fora do componente
  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Layout>
      {/* Sidebar with logo and menu list */}
      {/* Barra lateral com logo e lista de menus */}
      <Sider className='sidebar' collapsed={true} collapsible={false}>
        <Logo />
        <Menulist onSelectServer={handleSelectServer} toggleSidebar={toggleSidebar} />
      </Sider>
      
      <Layout>
        <div style={{ display: 'flex', flexGrow: 1, position: 'relative' }}>
          {/* Session Info Sidebar */}
          {/* Barra lateral com informações da sessão */}
          {sidebarVisible && (
            <SessionInfoSidebar
              sessionName={sessions[selectedServer].name}
              sessionId={sessions[selectedServer].id}
            />
          )}
          
          {/* Map session component */}
          {/* Componente da sessão do mapa */}
          <MapSession sessionId={sessions[selectedServer].id} onIconClick={handleMapIconClick} />
          
          {/* User Info Sidebar */}
          {/* Barra lateral com informações do usuário */}
          {userSidebarVisible && selectedFlight && (
            <UserInfoSidebar 
              ref={userSidebarRef} 
              isVisible={userSidebarVisible} 
              flightData={selectedFlight} // Pass flight data / Passa os dados do voo
              sessionId={sessions[selectedServer].id} // Pass session ID / Passa o ID da sessão
            />
          )}
        </div>
      </Layout>
    </Layout>
  );
};

export default SidebarMenu;
