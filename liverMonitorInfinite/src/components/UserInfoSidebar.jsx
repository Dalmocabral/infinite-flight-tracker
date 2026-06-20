import { forwardRef, useEffect, useState } from 'react';
import { Chart } from "react-google-charts"; // Importando o componente do Google Charts
import { CiPaperplane } from "react-icons/ci";
import { FaShieldAlt } from "react-icons/fa"; // Ícone de escudo
import { FaPlane, FaTwitch, FaYoutube } from "react-icons/fa6"; // Import FaPlane
import defaultImage from "../assets/ovni.png"; // Imagem padrão
import ApiService from './ApiService'; // Importe o objeto ApiService
import getAircraft from "./GetAircraft.json";
import liveries from "./ImageAirplane.json";
import staffList from "./staff.json";
import stremeruser from "./Stremer.json";
import "./UserInfoSidebar.css";

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon1 - lon2) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d / 1852; // Retorna a distância em milhas náuticas
};

// Otimização de Performance: Dicionário O(1) para lookup instantâneo
const liveryMap = liveries.reduce((acc, livery) => {
  if (livery.id && livery.image) {
    acc[livery.id] = livery.image;
  }
  return acc;
}, {});

const getLiveryImage = (liveryId) => {
  const imagePath = liveryMap[liveryId];
  if (imagePath) {
    // Remover a barra inicial do JSON e adicionar o BASE_URL correto do Vite
    return `${import.meta.env.BASE_URL}${imagePath.replace(/^\//, "")}`;
  }
  return defaultImage;
};

const UserInfoSidebar = forwardRef(({ isVisible, flightData, sessionId }, ref) => {
  const [flightPlan, setFlightPlan] = useState(null);
  const [firstWaypoint, setFirstWaypoint] = useState("N/A");
  const [lastWaypoint, setLastWaypoint] = useState("N/A");
  const [distanceToDestination, setDistanceToDestination] = useState(null);
  const [totalDistance, setTotalDistance] = useState(null);
  const [etaZulu, setEtaZulu] = useState("N/A");
  const [etaLocal, setEtaLocal] = useState("N/A");
  const [aircraftName, setAircraftName] = useState("");
  const [waypoints, setWaypoints] = useState([]);
  const [userStatus, setUserStatus] = useState({ xp: 0, grade: "N/A", flightTime: "0:00" });
  const [progress, setProgress] = useState(0);
  const [airplaneLogos, setAirplaneLogos] = useState([]); // Estado para armazenar os dados da API
  const [chartData, setChartData] = useState([["Time", "Altitude", "Ground Speed"]]); // Dados iniciais para o gráfico

  const [isFlightPlanOpen, setIsFlightPlanOpen] = useState(false);

  const [targetEtaTime, setTargetEtaTime] = useState(null);
  const [targetTodTime, setTargetTodTime] = useState(null);
  const [distanceToTodNm, setDistanceToTodNm] = useState(0);

  const [liveArrival, setLiveArrival] = useState("--:--");
  const [liveTimeToDest, setLiveTimeToDest] = useState("--:--:--");
  const [liveTimeToTod, setLiveTimeToTod] = useState("--:--:--");

  useEffect(() => {
    const fetchRouteData = async () => {
      try {
        const route = await ApiService.getRoute(sessionId, flightData.flightId);
        console.log("Dados brutos da rota:", route); // Log dos dados completos

        if (!route || route.length === 0) {
          console.error("Dados da rota estão vazios ou inválidos");
          return;
        }

        // Transformar os dados recebidos no formato esperado pelo gráfico
        const formattedData = route.map((point, index) => [
          index.toString(), // Tempo como string para o eixo X
          point.altitude || 0, // Altitude, com fallback para 0
          point.groundSpeed || 0, // Ground Speed, com fallback para 0
        ]);

        setChartData([["Time", "Altitude", "Ground Speed"], ...formattedData]);
        console.log("Dados formatados para o gráfico:", [["Time", "Altitude", "Ground Speed"], ...formattedData]);
      } catch (error) {
        console.error("Erro ao buscar dados da rota:", error);
      }
    };

    if (flightData.flightId && sessionId) {
      fetchRouteData();
    }
  }, [flightData.flightId, sessionId]);





  const fetchAirplaneLogoData = async () => {
    try {
      const data = await ApiService.getAirplaneLogoData();
      setAirplaneLogos(data); // Armazena os dados do logo no estado
    } catch (error) {
      console.error("Erro ao buscar os logos dos aviões:", error);
    }
  };

  useEffect(() => {
    fetchAirplaneLogoData();
  }, []);

  const getLiveryLogo = () => {
    const matchingLogo = airplaneLogos.find(logo => logo.LiveryId === flightData.liveryId);
    return matchingLogo ? matchingLogo.Logo : null;
  };

  const logoUrl = getLiveryLogo();


  // Função para converter minutos em formato HH:mm
  const convertMinutesToHHMM = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };


  // State for static route data
  const [routeInfo, setRouteInfo] = useState({
      startLocation: null,
      endLocation: null,
      totalDistance: null
  });

  // 1. Fetch Flight Plan (Run only when ID changes)
  useEffect(() => {
    const fetchFlightPlan = async () => {
      try {
        const data = await ApiService.getFlightPlan(sessionId, flightData.flightId);
        setFlightPlan(data);

        if (data && data.result && data.result.flightPlanItems) {
          const flightPlanItems = data.result.flightPlanItems;
          if (flightPlanItems.length > 0) {
            const start = flightPlanItems[0].location;
            const end = flightPlanItems[flightPlanItems.length - 1].location;

            const totalDist = calculateDistance(
              start.latitude,
              start.longitude,
              end.latitude,
              end.longitude
            );

            setRouteInfo({
                startLocation: start,
                endLocation: end,
                totalDistance: totalDist
            });
            setTotalDistance(totalDist); // Keep legacy state if needed, or rely on routeInfo
          }
        }

        if (data && data.result && data.result.waypoints) {
          const waypoints = data.result.waypoints;
          if (waypoints.length > 0) {
            setWaypoints(waypoints);
            setFirstWaypoint(waypoints[0] || "N/A");
            setLastWaypoint(waypoints[waypoints.length - 1] || "N/A");
          }
        }
      } catch (error) {
        console.error("Erro ao buscar o plano de voo:", error);
      }
    };

    if (flightData.flightId && sessionId) {
      // Reset critical states on new flight
      setRouteInfo({ startLocation: null, endLocation: null, totalDistance: null });
      setDistanceToDestination(null);
      setEtaZulu("N/A");
      setEtaLocal("N/A");
      setProgress(0);
      setTargetEtaTime(null);
      setTargetTodTime(null);
      setDistanceToTodNm(0);
      
      fetchFlightPlan();
    }
  }, [flightData.flightId, sessionId]);

  // 2. Real-time Calculations (Run when flightData updates)
  useEffect(() => {
     if (!routeInfo.endLocation || !routeInfo.totalDistance) return;

     const { endLocation, totalDistance } = routeInfo;

     // Calculate Distance to Destination
     const distance = calculateDistance(
        flightData.latitude,
        flightData.longitude,
        endLocation.latitude,
        endLocation.longitude
      );
      setDistanceToDestination(distance.toFixed(0));

      // Calculate Progress
      // Ensure we don't divide by zero or get negative progress
      let currentProgress = 0;
      if (totalDistance > 0) {
          currentProgress = ((totalDistance - distance) / totalDistance) * 100;
      }
      // Clamp progress between 0 and 100
      currentProgress = Math.max(0, Math.min(100, currentProgress));
      setProgress(currentProgress);

      // Calculate ETA
      const speedInKnots = flightData.speed;
      if (speedInKnots > 10) { // Avoid division by zero or huge times when stopped
        const timeRemainingHours = distance / speedInKnots;
        const etaZuluTime = new Date(Date.now() + timeRemainingHours * 3600000);
        setTargetEtaTime(etaZuluTime.getTime());

        setEtaZulu(etaZuluTime.toISOString().split("T")[1].substring(0, 5));

        const localTimeOffset = etaZuluTime.getTimezoneOffset() * 60000;
        const etaLocalTime = new Date(etaZuluTime.getTime() - localTimeOffset);
        setEtaLocal(etaLocalTime.toISOString().split("T")[1].substring(0, 5));
        
        // Calculate TOD (Rule of thumb: 3nm per 1000ft)
        const todDistance = (flightData.altitude / 1000) * 3;
        const distToTod = Math.max(0, distance - todDistance);
        setDistanceToTodNm(distToTod);
        
        if (distToTod > 0) {
            const todHours = distToTod / speedInKnots;
            setTargetTodTime(Date.now() + todHours * 3600000);
        } else {
            setTargetTodTime(null);
        }

      } else {
          setEtaZulu("--:--");
          setEtaLocal("--:--");
          setTargetEtaTime(null);
          setTargetTodTime(null);
          setDistanceToTodNm(0);
      }

  }, [flightData, routeInfo]);

  useEffect(() => {
    const aircraft = getAircraft.result.find((a) => a.id === flightData.aircraftId);
    setAircraftName(aircraft ? aircraft.name : "Unknown Aircraft");
  }, [flightData.aircraftId]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();

      if (targetEtaTime) {
          let diffMs = targetEtaTime - now;
          if (diffMs < 0) diffMs = 0;

          const totalSeconds = Math.floor(diffMs / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const mins = Math.floor((totalSeconds % 3600) / 60);
          const secs = totalSeconds % 60;
          setLiveTimeToDest(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);

          const targetDate = new Date(targetEtaTime);
          const arrHours = String(targetDate.getUTCHours()).padStart(2, '0');
          const arrMins = String(targetDate.getUTCMinutes()).padStart(2, '0');
          setLiveArrival(`${arrHours}:${arrMins} Z`);
      } else {
          setLiveArrival("--:--");
          setLiveTimeToDest("--:--:--");
      }

      if (targetTodTime) {
          let diffMs = targetTodTime - now;
          if (diffMs < 0) diffMs = 0;

          const totalSeconds = Math.floor(diffMs / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const mins = Math.floor((totalSeconds % 3600) / 60);
          const secs = totalSeconds % 60;
          setLiveTimeToTod(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      } else {
          setLiveTimeToTod("--:--:--");
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [targetEtaTime, targetTodTime]);

  useEffect(() => {
    const fetchUserStatus = async () => {
      const status = await ApiService.userStatus(flightData.userId);
      if (status) {
        let avatarUrl = null;
        // Construct Avatar URL if available
        if (status.discourseUser && status.discourseUser.avatarTemplate) {
            // Replace {size} with desired pixel size (e.g. 128)
            // Prepend absolute domain
            avatarUrl = `https://community.infiniteflight.com${status.discourseUser.avatarTemplate.replace('{size}', '128')}`;
        }

        setUserStatus({
          xp: status.xp || 0,
          grade: status.grade || "N/A",
          flightTime: convertMinutesToHHMM(status.flightTime) || "0:00",
          avatarUrl: avatarUrl
        });
      }
    };

    if (flightData.userId) {
      fetchUserStatus();
    }
  }, [flightData.userId]);



  const handleClickInside = (e) => {
    e.stopPropagation();
  };

  const streamer = stremeruser.find((user) => user.username === flightData.username);
  const isStaff = staffList.some((staff) => staff.username === flightData.username);

  return (
    <div className={`user-info-sidebar ${isVisible ? 'visible' : ''}`} ref={ref} onClick={handleClickInside}>
      <div className="imageLivery">
        <img src={getLiveryImage(flightData.liveryId)} alt="Livery" className="livery-image" />
      </div>
      <div className="usercallsign">
        <span >
          {logoUrl ? (
            <img src={logoUrl} alt="Airplane Logo" className="airplane-logo" />
          ) : (
            <CiPaperplane />
          )}
        </span>
        <span className="callsign-text">{flightData.callsign}</span>
      </div>
      <div className="userroute">
        <div className="progress-container">
          <span>{firstWaypoint}</span>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${progress}%` }}></div>
            <FaPlane className="progress-icon" style={{ left: `${progress}%` }} />
          </div>
          <span>{lastWaypoint}</span>
        </div>
      </div>
      <div className="col-info-flight-user">
        <div className="info-box">
          <span>{distanceToDestination} nm</span>
          <p>DISTANCE</p>
        </div>
        <div className="info-box">
          <span>{flightData.altitude.toFixed(0)}</span>
          <p>ALTITUDE</p>
        </div>
        <div className="info-box">
          <span>{flightData.speed.toFixed(0)}</span>
          <p>SPEED</p>
        </div>
      </div>
      <div className="col-info-flight-user">
        <div className="info-box">
          <span>{etaZulu} Z</span>
          <p>ETA Zulu</p>
        </div>
        <div className="info-box">
          <span>{etaLocal}</span>
          <p>ETA Local</p>
        </div>
        <div className="info-box">
          <span>{aircraftName}</span>
          <p>AIRCRAFT</p>
        </div>
      </div>
      <div className="col-info-flight-user" style={{ marginTop: '-12px' }}>
        
        <div className="info-box">
          <span className="live-timer-text">{liveTimeToDest}</span>
          <p>DEST ({distanceToDestination ? distanceToDestination : 0}nm)</p>
        </div>
        <div className="info-box">
          <span className="live-timer-text">{liveTimeToTod}</span>
          <p>TOD ({distanceToTodNm > 0 ? distanceToTodNm.toFixed(0) : 0}nm)</p>
        </div>
      </div>
      <div className="route-info-user">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ marginBottom: 0 }}>ROUTE</span>
          <button 
              onClick={() => setIsFlightPlanOpen(!isFlightPlanOpen)}
              className="btn-toggle-flightplan"
          >
              {isFlightPlanOpen ? 'Close Flightplan' : 'Open Flightplan'}
          </button>
        </div>
        
        {isFlightPlanOpen && flightPlan?.result?.flightPlanItems ? (
          <div className="flight-plan-table-container">
            <table className="flight-plan-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Distance</th>
                        <th>Altitude</th>
                    </tr>
                </thead>
                <tbody>
                    {(() => {
                        const flattenedItems = [];
                        flightPlan.result.flightPlanItems.forEach(item => {
                            if (item.children && item.children.length > 0) {
                                flattenedItems.push(...item.children);
                            } else {
                                flattenedItems.push(item);
                            }
                        });
                        
                        return flattenedItems.map((item, index, arr) => {
                            let distance = 0;
                            if (index > 0) {
                                const prevItem = arr[index - 1];
                                distance = calculateDistance(
                                    prevItem.location.latitude, prevItem.location.longitude,
                                    item.location.latitude, item.location.longitude
                                );
                            }
                            const alt = item.altitude > 0 ? item.altitude : "";
                            return (
                                <tr key={index}>
                                    <td style={{ color: '#bfdbfe' }}>{item.name || item.identifier || "N/A"}</td>
                                    <td>{index === 0 ? "0.00" : distance.toFixed(2)}</td>
                                    <td>{alt}</td>
                                </tr>
                            );
                        });
                    })()}
                </tbody>
            </table>
          </div>
        ) : (
          <div className="waypoints-container">
            {waypoints.map((waypoint, index) => (
              <span key={index} className="waypoint">
                {waypoint || "Unknown"}
                {index < waypoints.length - 1 ? ' ' : ''}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="col-info-flight-user">
        <div className="info-box-user">
          <span>{userStatus.xp}</span>
          <p>XP</p>
        </div>
        <div className="info-box-user">
          <span>{userStatus.grade}</span>
          <p>GRADE</p>
        </div>
        <div className="info-box-user">
          <span>{userStatus.flightTime}</span>
          <p>TIME</p>
        </div>
      </div>
      <div className="inforusername">
        {userStatus.avatarUrl && (
             <div className="user-avatar-container">
                 <img 
                    src={userStatus.avatarUrl} 
                    alt={flightData.username} 
                    className="user-avatar-img" 
                    onError={(e) => e.target.style.display = 'none'} // Hide if broken
                 />
             </div>
        )}
        <span className="username-large">
          {flightData.username || "Anonymous User"}
          {isStaff && <FaShieldAlt className="staff-icon" />} {/* Ícone de escudo */}
        </span>

        {streamer && (
          <span className="stream-icons">
            {streamer.twitch && (
              <a href={streamer.twitch} target="_blank" rel="noopener noreferrer">
                <FaTwitch className="stream-icon" />
              </a>
            )}
            {streamer.youtube && (
              <a href={streamer.youtube} target="_blank" rel="noopener noreferrer">
                <FaYoutube className="stream-icon" />
              </a>
            )}
          </span>
        )}
      </div>
      <div className="inforusername">

        <span className="usernamevavo">
          {flightData.virtualOrganization || "Independent Pilot"}
        </span>
      </div>
      <div className="inforchart">
  {chartData.length > 1 ? (
    <Chart
      chartType="LineChart"
      width="100%" // Usa 100% para ocupar todo o espaço do card
      height="200px" // Ajuste a altura conforme necessário
      data={chartData}
      options={{
        vAxes: {
          0: { textStyle: { color: "#ffffff" } }, // Texto branco no eixo Y esquerdo
          1: { textStyle: { color: "#ffffff" } }, // Texto branco no eixo Y direito
        },
        series: {
          0: { targetAxisIndex: 0, color: "#1f77b4" }, // Altitude no eixo 0
          1: { targetAxisIndex: 1, color: "#ff0e22" }, // Ground Speed no eixo 1
        },
        backgroundColor: "transparent", // Fundo transparente
        chartArea: {
          left: 30, right: 30, top: 10, bottom: 10, // Ajuste as margens internas
        },
        legend: "none", // Remove as legendas
        titleTextStyle: { color: "#ffffff" }, // Título do gráfico em branco
      }}
    />
  ) : (
    <p>Loading chart...</p>
  )}
</div>




    </div>
  );
});

// Nome do componente para debugging
UserInfoSidebar.displayName = 'UserInfoSidebar';
export default UserInfoSidebar;
