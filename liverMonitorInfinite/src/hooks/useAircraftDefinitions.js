import { useQuery } from '@tanstack/react-query';
import ApiService from '../components/ApiService';

export const useAircraftDefinitions = () => {
  return useQuery({
    queryKey: ['aircraftDefinitions'],
    queryFn: async () => {
      const aircraftList = await ApiService.getAircraftDefinitions();
      
      // Transform list into a lookup map: { [aircraftId]: 'GE' | 'Medium' | 'Large' }
      const definitions = {};
      
      aircraftList.forEach(aircraft => {
        definitions[aircraft.id] = categorizeAircraft(aircraft.name);
      });
      
      return definitions;
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours (rarely changes)
    refetchOnWindowFocus: false,
  });
};

const categorizeAircraft = (name) => {
  const n = name.toLowerCase();

  // 1. Fighter Jets & Warbirds (User's List)
  // "militar caças"
  if (
    n.includes('f/a-18') ||
    n.includes('f-18') ||
    n.includes('f-16') ||
    n.includes('f-14') ||
    n.includes('f-22') ||
    n.includes('spitfire') ||
    n.includes('a-10') ||
    n.includes('p-38')
  ) {
    return 'Fighter';
  }

  // 2. Military Transport (User's List)
  // "militar transportes"
  if (
    n.includes('c-17') ||
    n.includes('ac-130') ||
    n.includes('c-130')
  ) {
    return 'MilitaryTransport';
  }

  // 3. Large Aircraft (User's List: "grande porte")
  // Note: Check variants like DC-10F and MD-11F HERE before checking generic DC-10/MD-11 in Medium.
  if (
    n.includes('dc-10f') ||
    n.includes('md-11f') ||
    n.includes('a330') || // Covers A330-200F, A330-900, A330-300
    n.includes('a340') ||
    n.includes('a350') ||
    n.includes('747') || // Covers 747-200, 400, SCA, SOFIA, 8, VC-25A
    n.includes('vc-25') ||
    n.includes('777') || // Covers 200ER, 200LR, 300ER, F
    n.includes('787') || // Covers 10, 8, 9
    n.includes('a380')
  ) {
    return 'Large';
  }

  // 4. Medium Aircraft (User's List: "medio")
  if (
    n.includes('challenger') ||
    n.includes('crj') ||
    n.includes('caravan') || // 208 Caravan (User wanted this in Medium)
    n.includes('a220') ||
    n.includes('a318') ||
    n.includes('a319') ||
    n.includes('a320') ||
    n.includes('a321') ||
    n.includes('717') ||
    n.includes('737') ||
    n.includes('dash 8') ||
    n.includes('q400') ||
    n.includes('e175') ||
    n.includes('e190') ||
    n.includes('757') ||
    n.includes('767') || // User put 767-300 in Medium
    n.includes('dc-10') || // Generic DC-10 (Pax) -> Medium (because DC-10F was caught above)
    n.includes('md-11')    // Generic MD-11 (Pax) -> Medium (because MD-11F was caught above)
  ) {
    return 'Medium';
  }

  // 5. GE (General Aviation) (User's List: "ge")
  // Fallback or explicit check? User listed 172, SR22, XCub, TBM.
  // Explicit check for safety, default to GE otherwise?
  if (
    n.includes('172') ||
    n.includes('skyhawk') ||
    n.includes('sr22') ||
    n.includes('xcub') ||
    n.includes('tbm')
  ) {
    return 'GE';
  }

  // Fallback for anything else (Defaults to GE based on original logic, or Medium?)
  // Let's default to GE for small things not listed, but maybe Medium is safer for unknowns?
  // Given the explicit lists, 'GE' fits the leftovers (Generic small props usually).
  return 'GE';
};
