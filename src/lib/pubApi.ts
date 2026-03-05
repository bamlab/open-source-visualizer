const PUB_BASE = 'https://pub.dev/api';

export interface PubPackageInfo {
  name: string;
  description: string | null;
  repositoryUrl: string | null;
}

interface PubSearchResponse {
  packages: Array<{ package: string }>;
}

interface PubPackageResponse {
  name: string;
  latest: {
    pubspec: {
      description?: string;
      repository?: string;
      homepage?: string;
    };
  };
}

export interface PubScoreResponse {
  downloadCount30Days: number;
  likeCount: number;
}

export async function fetchPubPublisherPackages(publisher: string): Promise<string[]> {
  const allNames: string[] = [];
  let page = 1;

  while (true) {
    const url = `${PUB_BASE}/search?q=${encodeURIComponent(`publisher:${publisher}`)}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`pub.dev search API error ${res.status} for ${publisher}`);
    const data: PubSearchResponse = await res.json();
    if (data.packages.length === 0) break;
    allNames.push(...data.packages.map((p) => p.package));
    page++;
  }

  return allNames;
}

export async function fetchPubPackageInfo(name: string): Promise<PubPackageInfo> {
  const url = `${PUB_BASE}/packages/${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`pub.dev package API error ${res.status} for ${name}`);
  const data: PubPackageResponse = await res.json();
  const pubspec = data.latest?.pubspec;
  return {
    name,
    description: pubspec?.description ?? null,
    repositoryUrl: pubspec?.repository ?? pubspec?.homepage ?? null,
  };
}

export async function fetchPubScore(name: string): Promise<PubScoreResponse | null> {
  const url = `${PUB_BASE}/packages/${encodeURIComponent(name)}/score`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json() as Promise<PubScoreResponse>;
}
