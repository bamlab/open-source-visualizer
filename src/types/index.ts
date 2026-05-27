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

export interface ConferenceTalk {
  id: string; // stable index-based id
  talkTitle: string;
  speaker: string;
  conference: string; // Event name with the embedded Notion URL stripped
  eventDate: string | null; // ISO; first date when the export gives a range
  status: string; // e.g. "Talk Given"
  team: string; // Related Brand, e.g. "Theodo Apps"
  notionUrl: string | null; // extracted from the Event field
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
}

export interface ConferencesDataFile {
  generatedAt: string | null;
  talks: ConferenceTalk[];
  unresolvedCount: number; // talks whose city couldn't be resolved
}
