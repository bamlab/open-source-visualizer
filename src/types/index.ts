export interface DailyDownload {
  day: string; // 'YYYY-MM-DD'
  downloads: number;
}

export interface MonthlyDownload {
  month: string; // 'YYYY-MM'
  downloads: number;
}

export type Ecosystem = 'npm' | 'pub';

export interface PackageData {
  name: string;
  totalDownloads: number;
  monthlyDownloads: MonthlyDownload[];
  momGrowthPct: number | null;
  isGrowing: boolean;
  stars: number | null;
  description: string | null;
  notFound: boolean;
  ecosystem?: Ecosystem; // undefined = 'npm' for backward compat
}

export interface NpmDownloadResponse {
  downloads: DailyDownload[];
  start: string;
  end: string;
  package: string;
}

export interface DataFile {
  generatedAt: string | null;
  packages: PackageData[];
}

export interface NpmRegistryResponse {
  name: string;
  description?: string;
  repository?: {
    url?: string;
  };
}
