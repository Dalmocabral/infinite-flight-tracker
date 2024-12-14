import React, { useState, useRef } from 'react';
import MapSession from './MapSession';
import Menulist from './Menulist';
import SessionInfoSidebar from './SessionInfoSidebar';
import UserInfoSidebar from './UserInfoSidebar';
import Logo from './Logo';
import { Layout } from 'antd';
import "./SidebarMenu.css";

const { Sider } = Layout;

const sessions = {
  training: { id: '9ed5512e-b6eb-401f-bab8-42bdbdcf2bab', name: 'Training Server' }, // version 24.4
  casual: { id: '7e4681bf-9fee-4c68-ba62-eda1f2f0e780', name: 'Casual Server' }, // version 24.4
  expert: { id: '9bdfef34-f03b-4413-b8fa-c29949bb18f8', name: 'Expert Server' } // version 24.4
};

export const SidebarMenu = () => {
  const [selectedServer, setSelectedServer] = useState('expert');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [userSidebarVisible, setUserSidebarVisible] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null); // Adiciona o estado para o voo selecionado
  const userSidebarRef = useRef(null);

  const handleSelectServer = (serverKey) => {
    setSelectedServer(serverKey);
  };

  const handleMapIconClick = (flight) => { // Recebe o dado do voo
    setSelectedFlight(flight); // Armazena o voo selecionado
    setUserSidebarVisible(true);
  };

  const handleClickOutside = (event) => {
    if (userSidebarRef.current && !userSidebarRef.current.contains(event.target)) {
      setUserSidebarVisible(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Layout>
      <Sider className='sidebar' collapsed={true} collapsible={false}>
        <Logo />
        <Menulist onSelectServer={handleSelectServer} toggleSidebar={toggleSidebar} />
      </Sider>
      <Layout>
        <div style={{ display: 'flex', flexGrow: 1, position: 'relative' }}>
          {sidebarVisible && (
            <SessionInfoSidebar
              sessionName={sessions[selectedServer].name}
              sessionId={sessions[selectedServer].id}
            />
          )}
          <MapSession sessionId={sessions[selectedServer].id} onIconClick={handleMapIconClick} />
          {userSidebarVisible && selectedFlight && (
            <UserInfoSidebar 
              ref={userSidebarRef} 
              isVisible={userSidebarVisible} 
              flightData={selectedFlight} // Passa os dados do voo selecionado
              sessionId={sessions[selectedServer].id} // Passa o sessionId
            />
          )}
        </div>
      </Layout>
    </Layout>
  );
};

export default SidebarMenu;
