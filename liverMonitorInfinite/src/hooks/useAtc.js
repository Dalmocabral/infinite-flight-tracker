import { useQuery } from '@tanstack/react-query';
import ApiService from '../components/ApiService';

export const useAtc = (sessionId, enabled = true) => {
  return useQuery({
    queryKey: ['atc', sessionId],
    queryFn: async () => {
        return await ApiService.getAtcData(sessionId);
    },
    enabled: !!sessionId && enabled,
    refetchInterval: 20000, 
    staleTime: 15000,
  });
};
