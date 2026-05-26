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
  publishedAt?: string | null; // pub.dev only: ISO date of first version
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

export type PrState = 'merged' | 'open' | 'closed';

export interface PrRecord {
  author: string;
  repo: string;
  state: PrState;
  createdAt: string; // ISO
  title: string;
  url: string;
}

export interface RepoMeta {
  name: string; // owner/repo
  owner: string;
  language: string | null;
  stars: number;
}

export interface PersonStat {
  login: string;
  prCount: number;
  reposCount: number;
  topRepos: string[];
}

export interface PrsDataFile {
  generatedAt: string | null;
  org: string;
  prs: PrRecord[];
  repos: RepoMeta[];
  people: PersonStat[];
}
