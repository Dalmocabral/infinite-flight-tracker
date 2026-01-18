import { useQuery } from '@tanstack/react-query';
import ApiService from '../components/ApiService';

export const useFlights = (sessionId, enabled = true) => {
  return useQuery({
    queryKey: ['flights', sessionId],
    queryFn: async () => {
        const flights = await ApiService.getFlightData(sessionId);
        // Adapter logic (optional, if ApiService returns raw data)
        // Here we assume ApiService already returns the desired array
        return flights;
    },
    enabled: !!sessionId && enabled,
    refetchInterval: 5000, 
    staleTime: 3000, 
  });
};
