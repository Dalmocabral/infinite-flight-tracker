import { useQuery } from '@tanstack/react-query';
import ApiService from '../components/ApiService';

export const useNotams = (sessionId) => {
  return useQuery({
    queryKey: ['notams', sessionId],
    queryFn: async () => {
        if (!sessionId) return [];
        return await ApiService.getSessionNotams(sessionId);
    },
    enabled: !!sessionId,
    refetchInterval: 300000, // NOTAMs update rarely, 5 minutes is fine
    staleTime: 240000,
  });
};
