import { useQuery } from '@tanstack/react-query';
import ApiService from '../components/ApiService';
import { useIdleTimeout } from './useIdleTimeout';

export const useAtc = (sessionId, enabled = true) => {
  const isIdle = useIdleTimeout();

  return useQuery({
    queryKey: ['atc', sessionId],
    queryFn: async () => {
        return await ApiService.getAtcData(sessionId);
    },
    enabled: !!sessionId && enabled && !isIdle,
    refetchInterval: 20000, 
    staleTime: 15000,
  });
};
