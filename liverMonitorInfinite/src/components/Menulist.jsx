import { Menu } from "antd";
import { useState } from "react";
import { FaUsers } from "react-icons/fa";
import { FaEarthAmericas, FaGear, FaServer } from "react-icons/fa6";
import SettingsDialog from "./SettingsDialog"; // Import new component

const Menulist = ({ onSelectServer, toggleSidebar, togglePilotsSidebar, flightsData }) => {
  // Estado para controle do diálogo de configurações
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleOpenSettings = () => setIsSettingsOpen(true);
  const handleCloseSettings = () => setIsSettingsOpen(false);

  // Menu Items Definition
  const menuItems = [
    {
      key: 'server',
      icon: <FaServer />,
      label: 'Servers',
      children: [
        { key: 'casual', label: 'Casual server' },
        { key: 'training', label: 'Training server' },
        { key: 'expert', label: 'Expert server' },
      ],
    },
    {
      key: 'toggleinfo',
      icon: <FaEarthAmericas />,
      label: 'Server Info',
    },
    {
      key: 'pilots',
      icon: <FaUsers />,
      label: 'Pilots',
    },
    {
      key: 'setting',
      icon: <FaGear />,
      label: 'Settings',
    },
  ];

  // Menu Click Handler
  const handleMenuClick = (e) => {
      switch (e.key) {
          case 'casual':
          case 'training':
          case 'expert':
              onSelectServer(e.key);
              break;
          case 'toggleinfo':
              toggleSidebar();
              break;
          case 'pilots':
              togglePilotsSidebar();
              break;
          case 'setting':
              handleOpenSettings();
              break;
          default:
              break;
      }
  };

  return (
    <>
      <Menu 
          theme="dark" 
          className="menu-bar" 
          mode="inline" 
          items={menuItems} 
          onClick={handleMenuClick} 
      />

      {/* New Settings Dialog with Dynamic VA List */}
      <SettingsDialog 
        open={isSettingsOpen} 
        onClose={handleCloseSettings} 
        flightsData={flightsData} 
      />
    </>
  );
};

export default Menulist;