import { useQuery } from '@tanstack/react-query';
import ApiService from '../components/ApiService';
import { useIdleTimeout } from './useIdleTimeout';

export const useFlights = (sessionId, enabled = true) => {
  const isIdle = useIdleTimeout();

  return useQuery({
    queryKey: ['flights', sessionId],
    queryFn: async () => {
        const flights = await ApiService.getFlightData(sessionId);
        // Adapter logic (optional, if ApiService returns raw data)
        // Here we assume ApiService already returns the desired array
        return flights;
    },
    enabled: !!sessionId && enabled && !isIdle,
    refetchInterval: 15000, 
    staleTime: 15000, 
  });
};
