import { useQuery } from '@tanstack/react-query';
import type { ConferencesDataFile } from '../types';

const EMPTY: ConferencesDataFile = {
  generatedAt: null,
  talks: [],
  unresolvedCount: 0,
};

export function useConferencesData(): { data: ConferencesDataFile; isLoading: boolean } {
  const { data, isLoading } = useQuery<ConferencesDataFile>({
    queryKey: ['conferences.json'],
    queryFn: () => fetch(`${import.meta.env.BASE_URL}conferences.json`).then((r) => r.json()),
    staleTime: 1000 * 60 * 60,
    retry: false,
  });

  return { data: data ?? EMPTY, isLoading };
}
