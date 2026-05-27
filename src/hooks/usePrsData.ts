import { useQuery } from '@tanstack/react-query';
import type { PrsDataFile } from '../types';

const EMPTY: PrsDataFile = {
  generatedAt: null,
  org: 'bamlab',
  prs: [],
  issues: [],
  repos: [],
  people: [],
};

export function usePrsData(): { data: PrsDataFile; isLoading: boolean } {
  const { data, isLoading } = useQuery<PrsDataFile>({
    queryKey: ['prs.json'],
    queryFn: () => fetch(`${import.meta.env.BASE_URL}prs.json`).then((r) => r.json()),
    staleTime: 1000 * 60 * 60,
    retry: false,
  });

  return { data: data ?? EMPTY, isLoading };
}
