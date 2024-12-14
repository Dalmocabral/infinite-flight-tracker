import { Menu } from "antd";
import {
  FaEarthAmericas,
  FaPlane,
  FaSatelliteDish,
  FaGear,
  FaRightFromBracket,
  FaServer,
} from "react-icons/fa6";

const Menulist = ({ onSelectServer, toggleSidebar }) => {
  return (
    <Menu theme="dark" className="menu-bar">
      <Menu.SubMenu key="server" icon={<FaServer />} title="Servers">
        <Menu.Item key="casual" onClick={() => onSelectServer('casual')}>
          Casual server
        </Menu.Item>
        <Menu.Item key="training" onClick={() => onSelectServer('training')}>
          Training server
        </Menu.Item>
        <Menu.Item key="expert" onClick={() => onSelectServer('expert')}>
          Expert server
        </Menu.Item>
      </Menu.SubMenu>
      <Menu.Item key="toggleinfo" icon={<FaEarthAmericas />} onClick={toggleSidebar}>
        Toggle Info
      </Menu.Item>      
      <Menu.Item key="setting" icon={<FaGear />}>
        Settings
      </Menu.Item>
      
    </Menu>
  );
};

export default Menulist;
