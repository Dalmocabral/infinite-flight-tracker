import { useQuery } from '@tanstack/react-query';
import ApiService from '../components/ApiService';

export const useSessions = () => {
    return useQuery({
        queryKey: ['sessions'],
        queryFn: async () => {
            const sessionsList = await ApiService.getSessions();
            // Adapt the list to our app's structure if needed
            // The API returns an array of objects: { id, name, userCount, ... }
            // We need to map it to a dictionary keyed by 'type' (casual, training, expert) if we want to maintain current logic
            // OR just return the list and let the UI filter.
            
            // Current Logic uses keys: casual, training, expert.
            // We should try to find these specific servers in the list.
            
            const sessionMap = {};
            sessionsList.forEach(session => {
                const name = session.name.toLowerCase();
                if (name.includes('casual')) sessionMap.casual = { id: session.id, name: session.name };
                if (name.includes('training')) sessionMap.training = { id: session.id, name: session.name };
                if (name.includes('expert')) sessionMap.expert = { id: session.id, name: session.name };
            });
            
            return sessionMap;
        },
        staleTime: 1000 * 60 * 60, // 1 hour (Sessions rarely change IDs)
        retry: 3
    });
};
