import { useEffect, useState } from "react";
import { Chart } from "react-google-charts";
import ApiService from './ApiService'; // Importa o serviço de API / Imports the API service
import aircraftDataJson from "./GetAircraft.json"; // Importa o JSON de aeronaves / Imports the aircraft JSON
import "./SessionInfoSidebar.css";
import "./SidebarMenu.css";

import { useAtc } from '../hooks/useAtc';
import { useFlights } from '../hooks/useFlights';
import SidebarSkeleton from './SidebarSkeleton';

const SessionInfoSidebar = ({ sessionName, sessionId, onAirportSelect }) => {
  // Estado para armazenar o número de usuários online
  const [userCount, setUserCount] = useState(null);
  
  // Hooks
  const { data: flightData, isLoading: isLoadingFlights } = useFlights(sessionId);
  const { data: atcData, isLoading: isLoadingAtc } = useAtc(sessionId);

  // Estados derivados (poderiam ser memoized, mas useEffect é ok para manter estrutura se preferir, ou melhor: useMemo)
  const [aircraftData, setAircraftData] = useState([]);
  const [airports, setAirports] = useState([]);
  
  // Fetch Session Data (Ainda manual pois não criamos hook específico useSession, mantemos useEffect simples ou criamos hook depois)
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const sessionData = await ApiService.getSessionData(sessionId);
        setUserCount(sessionData.userCount);
      } catch (error) {
        console.error("Erro ao buscar dados da sessão:", error);
      }
    };
    fetchSessionData();
  }, [sessionId]);

  // Process Flight Data for Charts & Airports
  useEffect(() => {
    if (!flightData) return;

    // 1. Aircraft Chart
    const aircraftCount = flightData.reduce((acc, flight) => {
        const { aircraftId } = flight;
        acc[aircraftId] = (acc[aircraftId] || 0) + 1;
        return acc;
    }, {});

    const aircraftArray = Object.entries(aircraftCount)
        .map(([id, count]) => {
        const aircraft = aircraftDataJson.result.find((ac) => ac.id === id);
        return [aircraft ? aircraft.name : "Desconhecido", count];
        })
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    setAircraftData([["Aircraft", "Count"], ...aircraftArray]);

  }, [flightData]);

  // Fetch Airports Data (Mantive separado pois ApiService.getAirportData parece ser endpoint diferente de getFlightData)
  // Se getAirportData não for hookificado, mantemos useEffect.
  // Nota: O plano original previa useFlights, useAtc. O getAirportData ainda é isolado.
  // Vamos manter o useEffect do AirportData por enquanto.
  useEffect(() => {
    const fetchAirportsData = async () => {
      try {
        const airportData = await ApiService.getAirportData(sessionId);
        const sortedAirports = airportData
          .sort((a, b) => b.inboundFlightsCount - a.inboundFlightsCount)
          .slice(0, 5);
        setAirports(sortedAirports);
      } catch (error) {
        console.error("Erro ao buscar dados dos aeroportos:", error);
      }
    };
    fetchAirportsData();
  }, [sessionId]);

  // Loading State
  if (isLoadingFlights || isLoadingAtc) {
      return <SidebarSkeleton />;
  }

  // Obtém o rótulo do tipo de ATC
  const getTypeLabel = (type) => {
    const typeLabels = ["grd", "twr", "unicom", "clr", "app", "dep", "ctr", "atis"];
    return typeLabels[type] || "";
  };

  // Agrupa os dados de ATC por aeroporto
  const atcGroupedByAirport = (atcData || []).reduce((acc, atc) => {
    const { airportName, type } = atc;
    const typeLabel = getTypeLabel(type);
    if (!acc[airportName]) {
      acc[airportName] = { 
          grd: false, twr: false, app: false, dep: false, ctr: false, atis: false,
          lat: atc.latitude, lon: atc.longitude // Store Coords
      };
    }
    if (typeLabel) {
      acc[airportName][typeLabel] = true;
    }
    return acc;
  }, {});

  return (
    <div className="session-info-sidebar">
      {/* Cabeçalho da barra lateral / Sidebar header */}
      <div className="statistics-header">
        <h3>Infinite Monitor Live</h3>
        <p>1.1.0v Alpha</p>
      </div>

      {/* Nome da sessão / Session name */}
      <div className="name-session">
        <h4>{sessionName}</h4>
      </div>

      {/* Contagem de usuários / User count */}
      <div className="session-count-user">
        {userCount !== null ? (
          <p>
            <span>{userCount}</span> Users Online
          </p>
        ) : (
          <p>Loading...</p>
        )}
      </div>

      {/* Gráfico de aeronaves / Aircraft chart */}
      <div className="chart-section">
        <div className="grafic-header">
          <h4>5 Popular Aircraft</h4>
        </div>
        <div className="chart-container">
          {aircraftData.length > 1 ? (
            <Chart
              chartType="PieChart"
              data={aircraftData}
              options={{
                pieHole: 0.4,
                backgroundColor: "transparent",
                legend: { position: "none" },
                pieSliceText: "label",
                slices: {
                  0: { color: "#1f15af" },
                  1: { color: "#3f32f3" },
                  2: { color: "#5b5dec" },
                  3: { color: "#6d6cb6" },
                  4: { color: "#9a99cc" },
                },
                chartArea: { width: "100%", height: "100%" },
              }}
              width="200px"
              height="200px"
            />
          ) : (
            <p>Loading chart...</p>
          )}
        </div>
      </div>

      {/* Tabela de aeroportos / Airports table */}
      <div className="statistics-section">
        <h4>Popular Airports</h4>
        <div className="airport-table">
          <div className="airport-table-header">
            <span className="labelInbound">Inbound</span>
            <span className="labelOutbound">Outbound</span>
          </div>
          {airports.map((airport) => (
            <div key={airport.airportIcao} className="airport-stat">
              <span className="inbound">{airport.inboundFlightsCount}</span>
              <span className="airport">{airport.airportIcao}</span>
              <span className="outbound">{airport.outboundFlightsCount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status de ATC / ATC status */}
      <div className="statistics-section-atc">
        <h4>ATC Status</h4>
        <ul>
          {Object.keys(atcGroupedByAirport).map((airport) => (
            // Pass onAirportSelect prop to component
            <li 
              key={airport} 
              className="airport-stat clickable" 
              onClick={() => {
                   // Find coordinates from the grouped data logic or pass raw data differently?
                   // Logic below adds click handler.
                   const group = atcGroupedByAirport[airport];
                   if (onAirportSelect && group.lat && group.lon) {
                       onAirportSelect(group.lat, group.lon);
                   }
              }}
            >
              <span className="airport">{airport}</span>
              <span className="atc-status">
                {atcGroupedByAirport[airport].grd && <span className="badge badge-grd">Grd</span>}
                {atcGroupedByAirport[airport].twr && <span className="badge badge-twr">Twr</span>}
                {atcGroupedByAirport[airport].app && <span className="badge badge-app">App</span>}
                {atcGroupedByAirport[airport].dep && <span className="badge badge-dep">Dep</span>}
                {atcGroupedByAirport[airport].ctr && <span className="badge badge-ctr">Ctr</span>}
                {atcGroupedByAirport[airport].atis && <span className="badge badge-atis">Atis</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SessionInfoSidebar;
