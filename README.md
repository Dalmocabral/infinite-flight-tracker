# ✈️ LiveFlight Monitor - Infinite Flight Tracker

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![MapLibre GL JS](https://img.shields.io/badge/MapLibre%20GL%20JS-000000?style=for-the-badge&logo=mapbox&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 🌟 Visão Geral do Projeto

O **LiveFlight Monitor - Infinite Flight Tracker** é uma aplicação web rápida e moderna, desenvolvida para proporcionar o rastreamento em tempo real de voos e operações de controle de tráfego aéreo (ATC) no simulador *Infinite Flight*. Construído com **React** e **MapLibre GL JS**, este projeto oferece uma visualização fluida e interativa do tráfego global, destacando-se pela sua performance e experiência de usuário.

## ✨ Funcionalidades Principais

Esta aplicação foi projetada com um conjunto robusto de funcionalidades para enriquecer a experiência de monitoramento de voos:

*   **Mapa Global Interativo**: Visualize em tempo real todos os voos ativos e as zonas de controle ATC em um mapa global dinâmico.
*   **Animações Suaves**: Desfrute de movimentos de aeronaves sem interrupções, graças à interpolação baseada em JavaScript de alta performance (`requestAnimationFrame`).
*   **Informações Detalhadas de Voo**: Ao clicar em qualquer aeronave, acesse dados em tempo real, incluindo:
    *   Telemetria (Altitude, Velocidade, Rumo).
    *   Trajetória do Plano de Voo (colorida por altitude).
    *   Detalhes do Piloto e da Organização.
*   **Integração ATC Avançada**:
    *   Visualização de limites para FIRs (Regiões de Informação de Voo).
    *   Zonas ATC interativas (Torre, Aproximação, Partida).
    *   Barra lateral com ATIS, NOTAMs e contagem de tráfego.
*   **Pesquisa Robusta**: Filtre voos por Nome de Usuário, Callsign ou Companhia Aérea Virtual, facilitando a localização de informações específicas.
*   **Configurações de Usuário Persistentes**: Suas preferências de mapa (Zoom, Centro) e filtros são salvas automaticamente, proporcionando uma experiência personalizada a cada uso.

## 🛠️ Pilha Tecnológica

O projeto `LiveFlight Monitor` demonstra o uso de tecnologias modernas e eficientes para o desenvolvimento de aplicações web de alto desempenho:

*   **Frontend**: Desenvolvido com **React 18** para uma interface de usuário reativa e modular, utilizando **Vite** para um ambiente de desenvolvimento rápido e otimizado.
*   **Mapeamento**: Implementado com **MapLibre GL JS** para renderização de mapas vetoriais e **MapTiler** para dados de mapa, garantindo visualizações detalhadas e personalizáveis.
*   **Gerenciamento de Estado e Dados**: Utiliza `@tanstack/react-query` para gerenciamento eficiente de estado assíncrono e `Axios` para comunicação com APIs.
*   **Estrutura de Código**: Adota componentes funcionais e *Custom Hooks* para uma arquitetura limpa, reutilizável e de fácil manutenção.

## 🚀 Como Começar

Para configurar e executar o projeto em seu ambiente local, siga as instruções abaixo:

### Pré-requisitos

Certifique-se de ter as seguintes ferramentas instaladas:

*   Node.js (versão 18 ou superior)
*   Chave de API para Infinite Flight (ou dados simulados para desenvolvimento)
*   Chave de API para MapTiler (disponível no plano gratuito)

### Instalação

1.  **Clone o repositório**:

    ```bash
    git clone https://github.com/Dalmocabral/liveflight-monitor.git
    cd liveflight-monitor
    ```

2.  **Instale as dependências**:

    ```bash
    npm install
    ```

3.  **Configuração do Ambiente**: Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

    ```dotenv
    VITE_API_KEY=sua_chave_api_infinite_flight
    VITE_MAPTILER_KEY=sua_chave_maptiler
    ```

4.  **Execute o Servidor de Desenvolvimento**:

    ```bash
    npm run dev
    ```

## 🏗️ Arquitetura

A aplicação passou por uma refatoração significativa em Dezembro de 2025, com o objetivo de modularizar a lógica do mapa em *hooks* especializados, promovendo maior organização e reusabilidade do código.

### Hooks Principais (`src/hooks/map/`)

*   **`useMap.js`**:
    *   Responsável pela inicialização da instância do MapLibre.
    *   Gerencia a persistência de configurações de Zoom e Centro no armazenamento local.
    *   Lida com eventos de redimensionamento do mapa.
*   **`useAircraftMarkers.js`**:
    *   O "motor" da visualização, sincronizando o estado do React com os marcadores do MapLibre.
    *   Executa o loop de animação a 60fps para interpolação suave das posições das aeronaves.
*   **`useTrajectory.js`**:
    *   Busca dados do plano de voo e lida com o desenrolar de coordenadas (atravessando a Linha Internacional de Data).
    *   Renderiza a linha de trajetória colorida por altitude.
*   **`useAtcLayer.js`**:
    *   Busca limites globais de ATC (GeoJSON).
    *   Renderiza polígonos FIR e círculos de fallback para ATC local.
    *   Gerencia a interação de clique para a barra lateral de informações ATC.

### Estrutura de Componentes

*   **`MapSession.jsx`**: O componente principal que coordena a composição dos *hooks* acima.
*   **`SidebarMenu.jsx`**: Gerencia as sobreposições da interface do usuário e a funcionalidade de pesquisa.
*   **`AtcInfoSidebar.jsx`**: Exibe informações detalhadas do controlador ATC.

## 📧 Contato

Para dúvidas, sugestões ou colaborações, sinta-se à vontade para entrar em contato através do meu perfil no GitHub ou outras redes sociais. Estou sempre aberto a novas ideias e aprendizados!

---

*Desenvolvido com paixão por Dalmo dos Santos Cabral.*
