import { useQuery } from '@tanstack/react-query';
import ApiService from '../components/ApiService';

export const useAirportStatus = (sessionId) => {
  return useQuery({
    queryKey: ['airportStatus', sessionId],
    queryFn: async () => {
        // Fetch global airport status (traffic counts)
        const data = await ApiService.getAirportData(sessionId); 
        console.log("World Status Data:", data);
        return data;
    },
    enabled: !!sessionId,
    refetchInterval: 60000, 
    staleTime: 30000,
  });
};
