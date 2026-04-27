// ApiService.js
import axios from 'axios';

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = 'https://api.infiniteflight.com/public/v2';

const cache = new Map();

function getCached(key, ttlMs, fetchFn) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < ttlMs) {
    return Promise.resolve(entry.data);
  }
  return fetchFn().then(data => {
    cache.set(key, { data, time: Date.now() });
    return data;
  });
}

const ApiService = {
  getSessionData: async (sessionId) => {
    return getCached(`session_${sessionId}`, 10 * 60 * 1000, async () => {
      try {
        const response = await axios.get(`${BASE_URL}/sessions/${sessionId}?apikey=${API_KEY}`);
        return response.data.result;
      } catch (error) {
        console.error("Error fetching session data:", error);
        throw error;
      }
    });
  },

  getSessions: async () => {
    return getCached('sessions', 10 * 60 * 1000, async () => {
      try {
          const response = await axios.get(`${BASE_URL}/sessions?apikey=${API_KEY}`);
          return response.data.result;
      } catch (error) {
           console.error("Error fetching sessions list:", error);
           throw error;
      }
    });
  },

  getFlightData: async (sessionId) => {
    return getCached(`flights_${sessionId}`, 15 * 1000, async () => {
      try {
        const response = await axios.get(`${BASE_URL}/sessions/${sessionId}/flights?apikey=${API_KEY}`);
        return response.data.result;
      } catch (error) {
        console.error("Error fetching flight data:", error);
        throw error;
      }
    });
  },

  getAirportData: async (sessionId) => {
    return getCached(`world_${sessionId}`, 15 * 1000, async () => {
      try {
        const response = await axios.get(`${BASE_URL}/sessions/${sessionId}/world?apikey=${API_KEY}`);
        return response.data.result;
      } catch (error) {
        console.error("Error fetching airport data:", error);
        throw error;
      }
    });
  },

  getAtcData: async (sessionId) => {
    return getCached(`atc_${sessionId}`, 15 * 1000, async () => {
      try {
        const response = await axios.get(`${BASE_URL}/sessions/${sessionId}/atc?apikey=${API_KEY}`);
        return response.data.result.filter(atc => atc.airportName && atc.type !== null);
      } catch (error) {
        console.error("Error fetching ATC data:", error);
        throw error;
      }
    });
  },

  getFlightPlan: async (sessionId, flightId) => {
    return getCached(`flightplan_${flightId}`, 15 * 1000, async () => {
      try {
        const response = await axios.get(`${BASE_URL}/sessions/${sessionId}/flights/${flightId}/flightplan?apikey=${API_KEY}`);
        return response.data;
      } catch (error) {
        console.error("Error fetching flight plan data:", error);
        throw error;
      }
    });
  },

  userStatus: async (userId) => {
    return getCached(`user_${userId}`, 5 * 60 * 1000, async () => {
      try {
        const parameters = { userIds: [userId] };
        const headers = { "Content-type": "application/json", Accept: "application/json" };
        const url = `${BASE_URL}/users?apikey=${API_KEY}`;

        const response = await axios.post(url, parameters, { headers });
        return response.data.result[0]; // A API retorna um array, então pegamos o primeiro item
      } catch (error) {
        console.error("Error fetching user status:", error);
        return null;
      }
    });
  },

  getRoute: async (sessionId, flightId) => {
    return getCached(`route_${flightId}`, 15 * 1000, async () => {
      try {
        const url = `${BASE_URL}/sessions/${sessionId}/flights/${flightId}/route?apikey=${API_KEY}`;
        const response = await axios.get(url);
        return response.data.result;
      } catch (error) {
        console.error('Error fetching route data:', error);
        throw error;
      }
    });
  },

  // Novo método para consumir a API do logo de avião
  getAirplaneLogoData: async () => {
    return getCached('airplane_logo', 60 * 60 * 1000, async () => {
      try {
        const url = 'https://raw.githubusercontent.com/Dalmocabral/logo_airplane_if_json/refs/heads/main/logo_aiplane_if_json';
        const response = await axios.get(url);
        return response.data; // Retorna o JSON do logo
      } catch (error) {
        console.error('Error fetching airplane logo data:', error);
        throw error;
      }
    });
  },

  getAirportAtis: async (sessionId, airportIcao) => {
    return getCached(`atis_${sessionId}_${airportIcao}`, 15 * 1000, async () => {
      try {
        const response = await axios.get(`${BASE_URL}/sessions/${sessionId}/airport/${airportIcao}/atis?apikey=${API_KEY}`);
        return response.data.result;
      } catch (error) {
        console.error("Error fetching ATIS info:", error);
        throw error;
      }
    });
  },

  getSessionNotams: async (sessionId) => {
    return getCached(`notams_${sessionId}`, 5 * 60 * 1000, async () => {
      try {
        const response = await axios.get(`${BASE_URL}/sessions/${sessionId}/notams?apikey=${API_KEY}`);
        return response.data.result;
      } catch (error) {
        console.error("Error fetching NOTAMs:", error);
        throw error;
      }
    });
  },

  getAirportStatus: async (sessionId, airportIcao) => {
    return getCached(`airport_status_${sessionId}_${airportIcao}`, 15 * 1000, async () => {
      try {
        const response = await axios.get(`${BASE_URL}/sessions/${sessionId}/airport/${airportIcao}/status?apikey=${API_KEY}`);
        return response.data.result;
      } catch (error) {
        console.error("Error fetching airport status:", error);
        throw error;
      }
    });
  },

  getAirportInfo: async (airportIcao) => {
    return getCached(`airport_info_${airportIcao}`, 60 * 60 * 1000, async () => {
      try {
          const response = await axios.get(`${BASE_URL}/airport/${airportIcao}?apikey=${API_KEY}`);
          return response.data.result;
      } catch (error) {
          console.error(`Error fetching info for ${airportIcao}:`, error);
          throw error;
      }
    });
  },

  getAircraftDefinitions: async () => {
    return getCached('aircraft_defs', 60 * 60 * 1000, async () => {
      try {
        const response = await axios.get(`${BASE_URL}/aircraft?apikey=${API_KEY}`);
        return response.data.result;
      } catch (error) {
        console.error("Error fetching aircraft definitions:", error);
        throw error;
      }
    });
  },
};

export default ApiService;
