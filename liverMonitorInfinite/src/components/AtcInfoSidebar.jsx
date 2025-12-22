import { forwardRef, useEffect, useState } from "react";
import ApiService from "./ApiService";
import "./AtcInfoSidebar.css";

const AtcInfoSidebar = forwardRef(({ atc, sessionId, onClose }, ref) => {
  const [atisInfo, setAtisInfo] = useState(null);
  const [notams, setNotams] = useState([]);
  const [airportStatus, setAirportStatus] = useState({
    inboundFlightsCount: 0,
    outboundFlightsCount: 0,
    airportName: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (atc && sessionId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          // Fetch ATIS
          try {
             const atis = await ApiService.getAirportAtis(sessionId, atc.airportName);
             setAtisInfo(atis);
          } catch (e) {
             setAtisInfo(null);
          }

          // Fetch NOTAMs
          try {
             const allNotams = await ApiService.getSessionNotams(sessionId);
             const filteredNotams = allNotams.filter(
                (notam) => notam.icao === atc.airportName
             );
             setNotams(filteredNotams);
          } catch (e) {
             setNotams([]);
          }

          // Fetch Status
          try {
             const status = await ApiService.getAirportStatus(sessionId, atc.airportName);
             setAirportStatus(status);
          } catch (e) {
             setAirportStatus({ inboundFlightsCount: 0, outboundFlightsCount: 0, airportName: atc.airportName });
          }

        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [atc, sessionId]);

  if (!atc) return null;

  return (
    <div className={`atc-info-sidebar ${atc ? 'open' : ''}`} ref={ref}>
      <div className="atc-info-header">
        <h3>
          {
            [
              "Ground",
              "Tower",
              "Unicom",
              "Clearance",
              "Approach",
              "Departure",
              "Center",
              "ATIS",
              "Aircraft",
              "Recorded",
              "Unknown",
              "Unused",
            ][atc.type] || "ATC"
          }
        </h3>
        <h5>{atc.airportName}</h5>
        <p>{airportStatus.airportName}</p>
      </div>

      <div className="atc-info-content">
          <div className="atc-info-section">
            <span className="section-title">ATIS</span>
            <p className="atis-text">{atisInfo ? atisInfo : "No ATIS information available."}</p>
          </div>

          <div className="atc-info-section">
            <span className="section-title">NOTAMs</span>
            {notams.length > 0 ? (
              notams.map((notam) => (
                <div key={notam.id} className="notam-item">
                  <h4>{notam.title}</h4>
                  <p>{notam.message}</p>
                  <p className="notam-author">
                    <strong>Author:</strong> {notam.author}
                  </p>
                </div>
              ))
            ) : (
              <p>No NOTAMs available.</p>
            )}
          </div>

          <div className="atc-info-section">
            <span className="section-title">Traffic</span>
            <div className="traffic-stats">
              <div className="stat-box">
                <span className="stat-value">{airportStatus.inboundFlightsCount}</span>
                <span className="stat-label">Inbound</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">{airportStatus.outboundFlightsCount}</span>
                <span className="stat-label">Outbound</span>
              </div>
            </div>
          </div>

          <div className="atc-info-section">
            <span className="section-title">Controller</span>
            <p><strong>{atc.username || "Unknown"}</strong></p>
            <p className="time-stat">
              On Frequency since: {atc.startTime ? new Date(atc.startTime).toLocaleTimeString() : '-'}
            </p>
          </div>
      </div>
    </div>
  );
});

export default AtcInfoSidebar;
