import { useQuery } from '@tanstack/react-query';
import { PACKAGES } from '../constants/packages';
import type { DataFile, PackageData } from '../types';

const EMPTY_PACKAGES: PackageData[] = PACKAGES.map((name) => ({
  name,
  totalDownloads: 0,
  monthlyDownloads: [],
  momGrowthPct: null,
  isGrowing: false,
  stars: null,
  description: null,
  notFound: false,
}));

export function useAllPackageData(): { packages: PackageData[]; isLoading: boolean; generatedAt: string | null } {
  const { data, isLoading } = useQuery<DataFile>({
    queryKey: ['data.json'],
    queryFn: () => fetch(`${import.meta.env.BASE_URL}data.json`).then((r) => r.json()),
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: false,
  });

  return {
    packages: data?.packages ?? EMPTY_PACKAGES,
    isLoading,
    generatedAt: data?.generatedAt ?? null,
  };
}
