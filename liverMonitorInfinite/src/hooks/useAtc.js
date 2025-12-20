import { useQuery } from '@tanstack/react-query';
import ApiService from '../components/ApiService';

export const useAtc = (sessionId) => {
  return useQuery({
    queryKey: ['atc', sessionId],
    queryFn: async () => {
        return await ApiService.getAtcData(sessionId);
    },
    enabled: !!sessionId,
    refetchInterval: 60000, // ATC changes less frequently, 60s is good
    staleTime: 50000,
  });
};
