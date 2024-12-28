import React, { useEffect, useRef, useState } from "react";
import maplibregl, { NavigationControl } from "maplibre-gl"; // Importe NavigationControl

import '@maptiler/sdk/dist/maptiler-sdk.css';
import "./MapSession.css";
import ZuluClock from './ZuluClock';
import ApiService from './ApiService';
import stremerData from './stremer.json'; // Importar o arquivo JSON
import staffData from './staff.json'; // Importar o arquivo JSON dos staffs
import dataSetIconAircraft from './dataSetIconAircraft.json';


const MapSession = ({ sessionId, onIconClick }) => {
  const mapContainer = useRef(null);
  const map = useRef();
  const markers = useRef([]);
  const [currentPolyline, setCurrentPolyline] = useState([]);
  const [flightPlanPolyline, setFlightPlanPolyline] = useState([]);

  // Recuperar dados salvos localmente
  const savedUsername = localStorage.getItem('formUsername');
  const savedVAName = localStorage.getItem('vaName');
  //console.log('LocalStorage username:', savedUsername);
  //console.log('LocalStorage VA/VO:', savedVAName);

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const flightData = await ApiService.getFlightData(sessionId);

        // Remover marcadores existentes
        markers.current.forEach(marker => marker.remove());
        markers.current = [];

        // Processar dados de cada voo
        flightData.forEach(flight => {
          const { latitude, longitude, heading, username, virtualOrganization, aircraftId } = flight;

          const el = document.createElement('div');

          // Verificar se o username está online no stremer.json
          const streamer = stremerData.find(st => st.username === username);

          // Verificar se o username está no staff.json
          const isStaff = staffData.some(staff => staff.username === username);

          // Comparar o aircraftId com o dataSetIconAircraft.json
          const aircraft = dataSetIconAircraft.GA.find(ac => ac.id === aircraftId);

          // Determinar o ícone do avião
          if (!username || username === null) {
            el.className = 'airplane-icon';
          } else if (username === savedUsername) {
            el.className = 'special-airplane-icon';
          } else if (virtualOrganization && virtualOrganization === savedVAName) {
            el.className = 'va-airplane-icon';
          } else if (streamer && (streamer.twitch || streamer.youtube)) {
            el.className = 'online-airplane-icon';
          } else if (isStaff) {
            el.className = 'staff-airplane-icon'; // Ícone para staff
          } else if (aircraft) {   
            el.className = 'custom-aircraft-icon'; // Classe personalizada para aviões específicos
          } else {
            el.className = 'airplane-icon';
          }



          el.style.transform = `rotate(${heading}deg)`;

          el.addEventListener('click', async () => {
            //console.log("Ícone do avião clicado, removendo polilinhas...");
            removePolylines();

            onIconClick(flight);

            try {
              const route = await ApiService.getRoute(sessionId, flight.flightId);

              if (route && route.length > 0) {
                //console.log("Dados da rota recebidos:", route);

                // Converter os dados da rota em coordenadas
                let coordinates = route.map(point => [point.longitude, point.latitude]);

                // Garantir que o ponto final (posição atual do avião) seja adicionado
                coordinates.push([longitude, latitude]);

                // Dividir a linha na Linha Internacional de Data, se necessário
                const correctedCoordinates = splitLineAtDateLine(coordinates);

                const newPolyline = [];

                correctedCoordinates.forEach((segment, index) => {
                  const layerId = `flight-route-segment-${index}`;

                  // Verificar se a camada já existe antes de adicionar
                  if (map.current.getLayer(layerId)) {
                    map.current.removeLayer(layerId);
                  }
                  if (map.current.getSource(layerId)) {
                    map.current.removeSource(layerId);
                  }

                  // Adicionar fonte GeoJSON
                  map.current.addSource(layerId, {
                    type: 'geojson',
                    data: {
                      type: 'Feature',
                      geometry: {
                        type: 'LineString',
                        coordinates: segment,
                      }
                    }
                  });

                  // Adicionar camada da linha
                  map.current.addLayer({
                    id: layerId,
                    type: 'line',
                    source: layerId,
                    paint: {
                      'line-color': '#0000FF',
                      'line-width': 2,
                    }
                  });

                  newPolyline.push(layerId);
                });

                // Salvar as novas polilinhas no estado
                setCurrentPolyline(newPolyline);
                //console.log("Polilinhas adicionadas:", newPolyline);
              } else {
                //console.warn("Nenhum dado de rota retornado.");
              }
            } catch (error) {
              //console.error('Erro ao buscar rota:', error);
            }
          });

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([longitude, latitude])
            .addTo(map.current);

          marker.setRotation(heading);
          markers.current.push(marker);
        });
      } catch (error) {
        console.error('Error fetching flight data:', error);
      }
    };

    if (!map.current && mapContainer.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: "https://api.maptiler.com/maps/basic/style.json?key=oLMznTPIDCPrc3mGZdoh",
        center: [0, 0],
        zoom: 2,
      });

      // Adicionar controles de navegação (Zoom In e Zoom Out)
      const navControl = new NavigationControl(); // Cria o controle de navegação
      map.current.addControl(navControl, 'bottom-right'); // Adiciona os controles no canto superior direito

      // Adicionar evento de clique no mapa para limpar polilinhas
      map.current.on('click', () => {
        //console.log("Mapa clicado, removendo polilinhas...");
        removePolylines();
      });
    }

    fetchFlights();
    const intervalId = setInterval(fetchFlights, 30000);
    return () => clearInterval(intervalId);
  }, [sessionId, onIconClick]);

  // Remover polilinhas ao mudar de servidor
  useEffect(() => {
    if (map.current) {
      removePolylines();
    }
  }, [sessionId]);

  // Função para remover polilinhas
  const removePolylines = () => {
    //console.log("Removendo polilinhas...");

    currentPolyline.forEach((layerId) => {
      if (map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId);
        //console.log(`Layer removido: ${layerId}`);
      }
      if (map.current.getSource(layerId)) {
        map.current.removeSource(layerId);
        //console.log(`Source removido: ${layerId}`);
      }
    });

    setCurrentPolyline([]);

    flightPlanPolyline.forEach((layerId) => {
      if (map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId);
        //console.log(`Layer removido: ${layerId}`);
      }
      if (map.current.getSource(layerId)) {
        map.current.removeSource(layerId);
        //console.log(`Source removido: ${layerId}`);
      }
    });

    setFlightPlanPolyline([]);
  };


  // Função para dividir linha na Linha Internacional de Data
  const splitLineAtDateLine = (points) => {
    let splitLines = [];
    let currentLine = [points[0]];

    for (let i = 1; i < points.length; i++) {
      const [prevLng, prevLat] = currentLine[currentLine.length - 1];
      const [currentLng, currentLat] = points[i];

      if (Math.abs(currentLng - prevLng) > 180) {
        const adjustedLng = currentLng > 0 ? currentLng - 360 : currentLng + 360;
        currentLine.push([adjustedLng, currentLat]);
        splitLines.push(currentLine);
        currentLine = [[currentLng, currentLat]];
      } else {
        currentLine.push([currentLng, currentLat]);
      }
    }

    splitLines.push(currentLine);
    return splitLines;
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div id="map" ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <ZuluClock />
    </div>
  );
};

export default MapSession;
