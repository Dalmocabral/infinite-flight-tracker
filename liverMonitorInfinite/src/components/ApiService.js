// ApiService.js
import axios from 'axios';

const API_KEY = 'nvo8c790hfa9q3duho2jhgd2jf8tgwqw';
const BASE_URL = 'https://api.infiniteflight.com/public/v2';

const ApiService = {
  getSessionData: async (sessionId) => {
    try {
      const response = await axios.get(`${BASE_URL}/sessions/${sessionId}?apikey=${API_KEY}`);
      return response.data.result;
    } catch (error) {
      console.error("Error fetching session data:", error);
      throw error;
    }
  },

  getFlightData: async (sessionId) => {
    try {
      const response = await axios.get(`${BASE_URL}/sessions/${sessionId}/flights?apikey=${API_KEY}`);
      return response.data.result;
    } catch (error) {
      console.error("Error fetching flight data:", error);
      throw error;
    }
  },

  getAirportData: async (sessionId) => {
    try {
      const response = await axios.get(`${BASE_URL}/world/status/${sessionId}?apikey=${API_KEY}`);
      return response.data.result;
    } catch (error) {
      console.error("Error fetching airport data:", error);
      throw error;
    }
  },

  getAtcData: async (sessionId) => {
    try {
      const response = await axios.get(`${BASE_URL}/sessions/${sessionId}/atc?apikey=${API_KEY}`);
      return response.data.result.filter(atc => atc.airportName && atc.type !== null);
    } catch (error) {
      console.error("Error fetching ATC data:", error);
      throw error;
    }
  },

  getFlightPlan: async (sessionId, flightId) => {
    try {
      const response = await axios.get(`${BASE_URL}/sessions/${sessionId}/flights/${flightId}/flightplan?apikey=${API_KEY}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching flight plan data:", error);
      throw error;
    }
  },

  userStatus: async (userId) => {
    try {
      const parameters = { userIds: [userId] };
      const headers = { "Content-type": "application/json", Accept: "text/plain" };
      const url = `${BASE_URL}/user/stats?apikey=${API_KEY}`;

      const response = await axios.post(url, parameters, { headers });
      return response.data.result[0]; // A API retorna um array, então pegamos o primeiro item
    } catch (error) {
      console.error("Error fetching user status:", error);
      return null;
    }
  },

  getRoute: async (sessionId, flightId) => {
    try {
      const url = `${BASE_URL}/sessions/${sessionId}/flights/${flightId}/route?apikey=${API_KEY}`;
      const response = await axios.get(url);
      return response.data.result;
    } catch (error) {
      console.error('Error fetching route data:', error);
      throw error;
    }
  },

  // Novo método para consumir a API do logo de avião
  getAirplaneLogoData: async () => {
    try {
      const url = 'https://raw.githubusercontent.com/Dalmocabral/logo_airplane_if_json/refs/heads/main/logo_aiplane_if_json';
      const response = await axios.get(url);
      return response.data; // Retorna o JSON do logo
    } catch (error) {
      console.error('Error fetching airplane logo data:', error);
      throw error;
    }
  },
};

export default ApiService;
