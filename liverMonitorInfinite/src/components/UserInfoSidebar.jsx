import React, { forwardRef, useState, useEffect } from 'react';
import "./UserInfoSidebar.css";
import liveries from "./ImageAirplane.json";
import getAircraft from "./GetAircraft.json";
import stremeruser from "./Stremer.json";
import ApiService from './ApiService'; // Importe o objeto ApiService
import defaultImage from "../assets/ovni.png"; // Imagem padrão
import { CiPaperplane } from "react-icons/ci";
import { IoIosAirplane } from "react-icons/io";
import { FaYoutube, FaTwitch } from "react-icons/fa6"; // Importar ícones
import staffList from "./Staff.json";
import { FaShieldAlt } from "react-icons/fa"; // Ícone de escudo

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

const getLiveryImage = (liveryId) => {
  const livery = liveries.find((l) => l.id === liveryId);
  return livery ? livery.image : defaultImage;
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


  // Função para converter minutos em formato HH:mm
const convertMinutesToHHMM = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};
  

  useEffect(() => {
    const fetchFlightPlan = async () => {
      try {
        const data = await ApiService.getFlightPlan(sessionId, flightData.flightId);
        setFlightPlan(data);

        if (data && data.result && data.result.flightPlanItems) {
          const flightPlanItems = data.result.flightPlanItems;
          if (flightPlanItems.length > 0) {
            const startLocation = flightPlanItems[0].location;
            const endLocation = flightPlanItems[flightPlanItems.length - 1].location;

            const totalDistance = calculateDistance(
              startLocation.latitude,
              startLocation.longitude,
              endLocation.latitude,
              endLocation.longitude
            );

            setTotalDistance(totalDistance);

            const distance = calculateDistance(
              flightData.latitude,
              flightData.longitude,
              endLocation.latitude,
              endLocation.longitude
            );
            setDistanceToDestination(distance.toFixed(0));

            // Ajuste da função progress para ser igual ao primeiro código
            const progress = ((totalDistance - distance) / totalDistance) * 100;
            setProgress(progress);

            const speedInKnots = flightData.speed;
            const timeRemainingHours = distance / speedInKnots;
            const etaZuluTime = new Date(Date.now() + timeRemainingHours * 3600000);

            setEtaZulu(etaZuluTime.toISOString().split("T")[1].substring(0, 5));

            const localTimeOffset = etaZuluTime.getTimezoneOffset() * 60000;
            const etaLocalTime = new Date(etaZuluTime.getTime() - localTimeOffset);
            setEtaLocal(etaLocalTime.toISOString().split("T")[1].substring(0, 5));
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

    if (flightData && sessionId) {
      fetchFlightPlan();
    }
  }, [flightData, sessionId]);

  useEffect(() => {
    const aircraft = getAircraft.result.find((a) => a.id === flightData.aircraftId);
    setAircraftName(aircraft ? aircraft.name : "Unknown Aircraft");
  }, [flightData.aircraftId]);

  useEffect(() => {
    const fetchUserStatus = async () => {
      const status = await ApiService.userStatus(flightData.userId);
      if (status) {
        setUserStatus({
          xp: status.xp || 0,
          grade: status.grade || "N/A",
          flightTime:convertMinutesToHHMM(status.flightTime) || "0:00",
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
        <span className="circuloIcon">
          <CiPaperplane />{" "}
        </span>{" "}
        {flightData.callsign}
      </div>
      <div className="userroute">
        <div className="progress-container">
          <span>{firstWaypoint}</span>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${progress}%` }}></div>
            <IoIosAirplane className="progress-icon" style={{ left: `${progress}%` }} />
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
      <div className="route-info-user">
        <span>ROUTE</span>
        <div className="waypoints-container">
          {waypoints.map((waypoint, index) => (
            <span key={index} className="waypoint">
              {waypoint || "Unknown"}
              {index < waypoints.length - 1 ? ' ' : ''}
            </span>
          ))}
        </div>
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
      <span className="username-large">{flightData.username}   {isStaff && <FaShieldAlt className="staff-icon" />} {/* Ícone de escudo */}</span>
        {streamer && (
          <span className="stream-icons">
            {streamer.twitch && <a href={streamer.twitch} target="_blank" rel="noopener noreferrer"><FaTwitch className="stream-icon" /></a>}
            {streamer.youtube && <a href={streamer.youtube} target="_blank" rel="noopener noreferrer"><FaYoutube className="stream-icon" /></a>}
          </span>
        )}
      </div>
    </div>
  );
});

// Nome do componente para debugging
UserInfoSidebar.displayName = 'UserInfoSidebar';
export default UserInfoSidebar;
