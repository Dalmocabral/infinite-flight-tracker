
import {
    Air,
    Speed,
    Thermostat,
    Visibility,
    Warning
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import './WeatherWidget.css';

const WeatherWidget = ({ icao }) => {
    const [metarData, setMetarData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!icao) return;

        const fetchMetar = async () => {
            setLoading(true);
            setError(false);
            try {
                // Free NOAA Public API (Text format)
                // Using a CORS proxy might be needed in production, but often works directly 
                // or we can use 'https://metar.vatsim.net/metar.php?id=' which is very permissive.
                const response = await fetch(`https://metar.vatsim.net/metar.php?id=${icao}`);
                if (!response.ok) throw new Error('Fetch failed');
                const text = await response.text();
                
                if (!text || text.trim().length === 0) throw new Error('No Data');

                setMetarData(parseMetar(text));
            } catch (err) {
                console.error("METAR fetch error:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchMetar();
    }, [icao]);

    const parseMetar = (raw) => {
        // Example: KMIA 252053Z 27008KT 10SM CLR 03/M02 A3010 RMK...
        
        let wind = { dir: '---', speed: '--' };
        let temp = '--';
        let vis = '--';
        let qnh = '----';

        // 1. Wind (e.g., 27008KT or VRB03KT)
        const windMatch = raw.match(/(\d{3}|VRB)(\d{2,3})(G\d{2,3})?KT/);
        if (windMatch) {
            wind.dir = windMatch[1];
            wind.speed = parseInt(windMatch[2], 10);
        }

        // 2. Temp (e.g., 03/M02)
        const tempMatch = raw.match(/(\d{2}|M\d{2})\/(\d{2}|M\d{2})/);
        if (tempMatch) {
            temp = tempMatch[1].replace('M', '-');
        }

        // 3. Visibility (e.g., 10SM, 9999)
        // North American
        const visMatchUS = raw.match(/\s(\d+(?:\/\d+)?)(SM)/);
        if (visMatchUS) {
            vis = visMatchUS[0].trim();
        } else {
            // International
            const visMatchIntl = raw.match(/\s(\d{4})\s/);
            if (visMatchIntl) {
                const v = parseInt(visMatchIntl[1], 10);
                vis = v === 9999 ? '10km+' : `${v}m`;
            } else if (raw.includes('CAVOK')) {
                vis = '10km+';
            }
        }

        // 4. QNH (e.g., A3010 or Q1019)
        const qnhMatch = raw.match(/(Q|A)(\d{4})/);
        if (qnhMatch) {
            if (qnhMatch[1] === 'Q') {
                qnh = qnhMatch[2]; // hPa
            } else {
                // inHg to hPa conversion: 30.10 * 33.8639
                const inHg = parseInt(qnhMatch[2], 10) / 100;
                qnh = Math.round(inHg * 33.8639);
            }
        }

        return { wind, temp, vis, qnh, raw };
    };

    if (loading) return <div className="weather-widget loading">Loading METAR...</div>;
    if (error) return <div className="weather-widget error"><Warning fontSize="small"/> Weather Unavailable</div>;
    if (!metarData) return null;

    return (
        <div className="weather-widget">
            {/* Top Row: Wind & Temp */}
            <div className="weather-row">
                <div className="weather-item">
                    <Air className="weather-icon wind-icon" />
                    <span className="weather-value">
                        {metarData.wind.dir}° <span className="unit">/</span> {metarData.wind.speed} <span className="unit">KTS</span>
                    </span>
                </div>
                <div className="weather-item">
                    <Thermostat className="weather-icon temp-icon" />
                    <span className="weather-value">
                        {metarData.temp}<span className="unit">°C</span>
                    </span>
                </div>
            </div>

            {/* Bottom Row: Vis & QNH */}
            <div className="weather-row">
                <div className="weather-item">
                    <Visibility className="weather-icon vis-icon" />
                    <span className="weather-label">VIS</span>
                    <span className="weather-value">{metarData.vis}</span>
                </div>
                <div className="weather-item">
                    <Speed className="weather-icon qnh-icon" />
                    <span className="weather-label">QNH</span>
                    <span className="weather-value">{metarData.qnh}</span>
                </div>
            </div>
            
             {/* Raw METAR tooltip or small text could go here if needed */}
        </div>
    );
};

export default WeatherWidget;
