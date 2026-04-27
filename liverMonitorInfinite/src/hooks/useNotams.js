import { useQuery } from '@tanstack/react-query';
import ApiService from '../components/ApiService';
import { useIdleTimeout } from './useIdleTimeout';

export const useNotams = (sessionId) => {
  const isIdle = useIdleTimeout();

  return useQuery({
    queryKey: ['notams', sessionId],
    queryFn: async () => {
        if (!sessionId) return [];
        return await ApiService.getSessionNotams(sessionId);
    },
    enabled: !!sessionId && !isIdle,
    refetchInterval: 300000, // NOTAMs update rarely, 5 minutes is fine
    staleTime: 240000,
  });
};
