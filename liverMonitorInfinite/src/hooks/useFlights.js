import { useQuery } from '@tanstack/react-query';
import ApiService from '../components/ApiService';

export const useFlights = (sessionId) => {
  return useQuery({
    queryKey: ['flights', sessionId],
    queryFn: async () => {
        const flights = await ApiService.getFlightData(sessionId);
        // Adapter logic (optional, if ApiService returns raw data)
        // Here we assume ApiService already returns the desired array
        return flights;
    },
    enabled: !!sessionId,
    refetchInterval: 30000, // 30 seconds polling as per original code
    staleTime: 20000, 
  });
};
