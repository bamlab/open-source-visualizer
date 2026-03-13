import { useQuery } from '@tanstack/react-query';
import type { DataFile, PackageData } from '../types';

export function useAllPackageData(): { packages: PackageData[]; isLoading: boolean; generatedAt: string | null } {
  const { data, isLoading } = useQuery<DataFile>({
    queryKey: ['data.json'],
    queryFn: () => fetch(`${import.meta.env.BASE_URL}data.json`).then((r) => r.json()),
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: false,
  });

  return {
    packages: data?.packages ?? [],
    isLoading,
    generatedAt: data?.generatedAt ?? null,
  };
}
