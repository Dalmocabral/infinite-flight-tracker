import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { Menu } from "antd";
import { useEffect, useState } from "react";
import { FaEarthAmericas, FaGear, FaServer } from "react-icons/fa6";



// Lista de opções de VA/VO
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
  // Estado para controle do diálogo (popup)
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Estado para os dados do formulário
  const [formData, setFormData] = useState({
    formUsername: "",
    vaVo: "",
  });

  /**
   * Abre o diálogo (popup).
   */
  const handleOpenDialog = () => setIsDialogOpen(true);

  /**
   * Fecha o diálogo (popup).
   */
  const handleCloseDialog = () => setIsDialogOpen(false);

  /**
   * Atualiza os valores do formulário e salva no Local Storage.
   * Updates form values and saves them to Local Storage.
   */
  const handleChange = (event) => {
    const { name, value } = event.target;
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);

    // Salva os dados no Local Storage
    localStorage.setItem("formUsername", updatedFormData.formUsername);
    localStorage.setItem("vaName", updatedFormData.vaVo);
  };

  /**
   * Recupera os dados salvos no Local Storage ao carregar o componente.
   * Fetches saved data from Local Storage when the component loads.
   */
  useEffect(() => {
    const savedData = localStorage.getItem("userFormData");
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, []);

  /**
   * Salva os dados do formulário no Local Storage e recarrega a página.
   * Saves form data to Local Storage and reloads the page.
   */
  const handleFormSubmit = () => {
    localStorage.setItem("userFormData", JSON.stringify(formData));
    setIsDialogOpen(false); // Fecha o diálogo
    window.location.reload(); // Recarrega a página
  };

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
      label: 'Toggle Info',
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
          case 'setting':
              handleOpenDialog();
              break;
          default:
              break;
      }
  };

  return (
    <>
      {/* Menu principal */}
      <Menu 
          theme="dark" 
          className="menu-bar" 
          mode="inline" 
          items={menuItems} 
          onClick={handleMenuClick} 
      />

      {/* Popup de configurações */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Settings</DialogTitle>
        <DialogContent>
          {/* Campo para Username IFC */}
          <TextField
            label="Username IFC"
            name="formUsername"
            value={formData.formUsername}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          {/* Campo para selecionar VA/VO */}
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
          {/* Botões do rodapé do diálogo */}
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