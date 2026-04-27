import { useQuery } from '@tanstack/react-query';
import ApiService from '../components/ApiService';
import { useIdleTimeout } from './useIdleTimeout';

export const useAirportStatus = (sessionId) => {
  const isIdle = useIdleTimeout();

  return useQuery({
    queryKey: ['airportStatus', sessionId],
    queryFn: async () => {
        // Fetch global airport status (traffic counts)
        const data = await ApiService.getAirportData(sessionId); 
        console.log("World Status Data:", data);
        return data;
    },
    enabled: !!sessionId && !isIdle,
    refetchInterval: 60000, 
    staleTime: 30000,
  });
};
