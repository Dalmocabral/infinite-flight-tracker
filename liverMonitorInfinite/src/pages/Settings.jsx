import React, { useState, useEffect } from 'react';
import { Form, Input, Switch, message, Card, Select } from 'antd';
import './Settings.css'

// Função principal do componente de configuração
const Settings = () => {
  // Estados para armazenar os valores dos campos e switches
  const [username, setUsername] = useState('');
  const [vaName, setVaName] = useState('(selecione uma opção)');  // Padrão: "selecione uma opção"
  const [isUsernameChecked, setIsUsernameChecked] = useState(false);
  const [isVaNameChecked, setIsVaNameChecked] = useState(false);  // Padrão: switch desativado
  const [isLogoChecked, setIsLogoChecked] = useState(false);

  // Carregar os dados do LocalStorage quando o componente for montado
  useEffect(() => {
    const savedUsername = localStorage.getItem('username') || 'Username IFC';; // Carrega o nome do usuário
    const savedVaName = localStorage.getItem('vaName') || '(selecione uma opção)';  // Padrão: "selecione uma opção"
    const savedIsUsernameChecked = localStorage.getItem('isUsernameChecked') === 'true'; // Carrega o estado do switch do username
    const savedIsVaNameChecked = localStorage.getItem('isVaNameChecked') === 'true';     // Carrega o estado do switch da VA/VO
    const savedIsLogoChecked = localStorage.getItem('isLogoChecked') === 'true';         // Carrega o estado do switch da logo

    if (savedUsername) setUsername(savedUsername);         // Define o nome do usuário carregado
    setVaName(savedVaName);                                // Define o nome da VA/VO ou "(selecione uma opção)"
    setIsUsernameChecked(savedIsUsernameChecked);          // Define o estado do switch de username carregado
    setIsVaNameChecked(savedIsVaNameChecked);              // Define o estado do switch de VA/VO carregado
    setIsLogoChecked(savedIsLogoChecked);                  // Define o estado do switch de logo carregado
  }, []); // O array vazio garante que o efeito só será executado uma vez, ao carregar o componente

  // Função chamada quando o switch de "Username IFC" é alterado
  const handleUsernameSwitchChange = (checked) => {
    setIsUsernameChecked(checked);  // Atualiza o estado do switch
    if (checked) {
      localStorage.setItem('username', username);  // Salva o nome do usuário no LocalStorage se o switch estiver ativado
      message.success('Username IFC salvo com sucesso!');  // Exibe uma mensagem de sucesso
    } else {
      localStorage.removeItem('username');  // Remove o nome do LocalStorage se o switch for desativado
      message.warning('Username IFC removido.');
    }
    localStorage.setItem('isUsernameChecked', checked);  // Salva o estado do switch no LocalStorage
  };


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

  
 // Função chamada quando o switch de "Nome VA/VO" é alterado
 const handleVaNameSwitchChange = (checked) => {
  setIsVaNameChecked(checked);  // Atualiza o estado do switch
  if (checked) {
    localStorage.setItem('vaName', vaName);  // Salva o nome da VA/VO no LocalStorage se o switch estiver ativado
    message.success('Nome VA/VO salvo com sucesso!');
  } else {
    localStorage.removeItem('vaName');  // Remove o nome do LocalStorage se o switch for desativado
    message.warning('Nome VA/VO removido.');
  }
  localStorage.setItem('isVaNameChecked', checked);  // Salva o estado do switch no LocalStorage
};

// Função chamada quando o switch de "Logo da Companhia" é alterado
const handleLogoSwitchChange = (checked) => {
  setIsLogoChecked(checked);  // Atualiza o estado do switch
  if (checked) {
    message.success('Logo da companhia confirmada!');  // Apenas exibe uma mensagem de sucesso
  } else {
    message.warning('Logo da companhia não confirmada.');
  }
  localStorage.setItem('isLogoChecked', checked);  // Salva o estado do switch no LocalStorage
};

return (
  <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
    <h1 style={{ fontSize: '100px', textAlign: 'center' }}>Settings</h1>
    
    <Form layout="vertical">
      <Card 
        style={{
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',  
          padding: '20px',                            
          marginTop: '20px'                           
        }}
      >
      {/* Nome do Usuário IFC */}
      <Form.Item label="Username IFC">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Input 
            placeholder="Digite o nome do usuário" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}  
            style={{ flex: 1, marginRight: '10px' }} 
          />
          <Switch 
            checked={isUsernameChecked} 
            onChange={handleUsernameSwitchChange}  
          />
        </div>
      </Form.Item>

      {/* Nome da VA/VO como Select */}
      <Form.Item label="Nome VA/VO">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Select
            placeholder="Selecione a VA/VO"
            value={vaName} 
            onChange={(value) => setVaName(value)}  
            style={{ flex: 1, marginRight: '10px' }} 
          >
            {vaOptions.map((va) => (
              <Select.Option key={va} value={va}>
                {va}
              </Select.Option>
            ))}
          </Select>
          <Switch 
            checked={isVaNameChecked} 
            onChange={handleVaNameSwitchChange}  
          />
        </div>
      </Form.Item> 
      </Card>
    </Form>
  </div>
);
};

export default Settings;