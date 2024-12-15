import React, { useState, useEffect } from "react";
import { Menu } from "antd";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import { FaEarthAmericas, FaGear, FaServer } from "react-icons/fa6";

const vaOptions = ['(selecione uma opção)',
  'Aegean Virtual [AEVA]',
  'Aerolíneas Argentinas Virtual [ARVA]',
  'AFLV Group [AFLV]',
  'Air Canada Virtual [ACVA]',
  'Air China Virtual Airline [CAVA]',
  'Air Europa Virtual [UXVA]',
  'Air France - KLM Virtual Group [AFKLM]',
  'Air Mauritius [MK]',
  'airBaltic Virtual [BTIV]',
  'Alaska Airlines Virtual [AK]',
  'All Nippon Airways Virtual Group [ANVA]',
  'American Virtual [AAVA]',
  'AnadoluJet Virtual [AJVA]',
  'Austrian Virtual [AUA]',
  'Avianca Virtual [AVVA]',
  'Azul Virtual Airlines [AZUL]',
  'Breeze Virtual [MXYV]',
  'Caribbean Virtual Airlines [BW]',
  'Cathay Pacific Virtual [CXVA]',
  'China Airlines Virtual [CIVA]',
  'China Eastern Virtual Airline [MUVA]',
  'China Southern Virtual Group [CZVG]',
  'Condor Virtual Airlines [DE]',
  'Corendon Virtual [CORVA]',
  'Delta Virtual Air Lines [DLVA]',
  'Discover Virtual [OCNVA]',
  'Dubai Virtual Airlines [DVA]',
  'easyJet Virtual [EZYVA]',
  'Egypt Air Virtual [VG]',
  'El Al Virtual [LYVA]',
  'Ethiopian Airlines [ETVA]',
  'Etihad Virtual Airways [EYV]',
  'FedEx Virtual Group [FDXV]',
  'Finnair Virtual [AYVA]',
  'French Bee Virtual [BF]',
  'Garuda Indonesia Virtual Group [GVG]',
  'Hainan Virtual Airlines [HNA]',
  'IAG Virtual [IAGVA]',
  'Icelandic Virtual [FI]',
  'IFAE - Global Air Forces [GAF]',
  'IFATC [IFATC]',
  'IFVARB [VARB]',
  'Indian Virtual [IN]',
  'Infinite Flight Aero Brasil [IFAB]',
  'Infinite Flight Airport Editing Team [IFAET]',
  'Infinite Flight Aviation Experts [IFAE]',
  'Infinite Flight Brasil [IFBR]',
  'Infinite Flight Carrer Alliance [IFCAA]',
  'Infinite Flight General Aviation Club [IFGAC]',
  'Infinite Flight Germany [IFGER]',
  'Infinite Flight Indonesia [IFFI]',
  'International First Responders [IFR]',
  'ITA Virtual Airways [ITAVA]',
  'JAL Virtual Group [JVG]',
  'Jet2 Virtual [LSVA]',
  'Korean Air Virtual [KEVA]',
  'Lion Group Virtual Airlines [LGVA]',
  'Lufty Virtual [LH]',
  'Malaysia Airlines Virtual [MHVA]',
  'Mexico Virtual [MXVA]',
  'New Zealand Virtual [NZVA]',
  'Norwegian Air Virtual [NAXV]',
  'Pacifica Virtual [PFVA]',
  'Pan Am Virtual [PAVA]',
  'Pegasus Virtual Airlines [PGVA]',
  'Porter Virtual [PDVA]',
  'Qantas Virtual Group [QVG]',
  'Qatari Virtual [QRV]',
  'Rex Virtual [ZLVA]',
  'Ryanair Virtual Group [FRVG]',
  'SAS Virtual Group [SV]',
  'Saudia Virtual [SVA]',
  'Singapore Virtual [SVG]',
  'SmartLynx Virtual [ARTV]',
  'Southwest Virtual [SWVA]',
  'STARLUX Virtual Airline [JXVA]',
  'Suisse Virtual [SUIVA]',
  'Sun Country Virtual [SCXV]',
  'SunExpress Virtual [SXVA]',
  'Texas Virtual Airways [TXVA]',
  'Thai Virtual Airlines [TGVA]',
  'TUI Virtual Group [TUIVG]',
  'Türkiye Virtual [TKVA]',
  'United Virtual [UVAL]',
  'UPS Virtual [UPSV]'
];

const Menulist = ({ onSelectServer, toggleSidebar }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Controle do popup
  const [formData, setFormData] = useState({
    formUsername: "",
    vaVo: "",
  });

  console.log(formData);

  // Funções para abrir e fechar o popup
  const handleOpenDialog = () => setIsDialogOpen(true);
  const handleCloseDialog = () => setIsDialogOpen(false);

  // Lida com mudanças no formulário
  const handleChange = (event) => {
    const { name, value } = event.target;
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);

    // Salva os dados no Local Storage
    localStorage.setItem("formUsername", updatedFormData.formUsername); // Alterado aqui
    localStorage.setItem("vaName", updatedFormData.vaVo); // Alterado aqui
  };

  // Recupera os dados do Local Storage ao carregar o componente
  useEffect(() => {
    const savedData = localStorage.getItem("userFormData");
    //console.log('teste 1', savedData)
    if (savedData) {
      setFormData(JSON.parse(savedData)); // Recupera e define os dados no estado
      
    }
  }, []);

  const handleFormSubmit = () => {
    localStorage.setItem("userFormData", JSON.stringify(formData));
    // Fecha o diálogo
    setIsDialogOpen(false);
    // Recarrega a página
    window.location.reload();
  };
  

  return (
    <>
      {/* Menu principal */}
      <Menu theme="dark" className="menu-bar">
        <Menu.SubMenu key="server" icon={<FaServer />} title="Servers">
          <Menu.Item key="casual" onClick={() => onSelectServer("casual")}>
            Casual server
          </Menu.Item>
          <Menu.Item key="training" onClick={() => onSelectServer("training")}>
            Training server
          </Menu.Item>
          <Menu.Item key="expert" onClick={() => onSelectServer("expert")}>
            Expert server
          </Menu.Item>
        </Menu.SubMenu>
        <Menu.Item key="toggleinfo" icon={<FaEarthAmericas />} onClick={toggleSidebar}>
          Toggle Info
        </Menu.Item>
        {/* Botão Settings abre o popup */}
        <Menu.Item key="setting" icon={<FaGear />} onClick={handleOpenDialog}>
          Settings
        </Menu.Item>
      </Menu>

      {/* Popup com Formulário */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Settings</DialogTitle>
        <DialogContent>
          {/* Campo Username IFC */}
          <TextField
            label="Username IFC"
            name="formUsername"
            value={formData.formUsername}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          {/* Campo VA/VO com Dropdown */}
          <FormControl fullWidth margin="normal">
            <InputLabel id="va-vo-label">VA/VO</InputLabel>
            <Select
              labelId="va-vo-label"
              name="vaVo"
              value={formData.vaVo}
              onChange={handleChange}
            >
              {vaOptions.map((option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          {/* Botões do rodapé */}
          <Button onClick={handleCloseDialog} color="error">
            Cancelar
          </Button>
          <Button onClick={handleFormSubmit} variant="contained" color="primary">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Menulist;