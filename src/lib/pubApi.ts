const PUB_BASE = 'https://pub.dev/api';

export interface PubPackageInfo {
  name: string;
  description: string | null;
  repositoryUrl: string | null;
  publishedAt: string | null; // ISO date of the first version
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
  versions?: Array<{ version: string; published: string }>;
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
  // Find the earliest published version to determine when the package was first released
  const publishedDates = (data.versions ?? []).map((v) => v.published).filter(Boolean);
  const publishedAt = publishedDates.length > 0
    ? publishedDates.reduce((earliest, d) => (d < earliest ? d : earliest))
    : null;

  return {
    name,
    description: pubspec?.description ?? null,
    repositoryUrl: pubspec?.repository ?? pubspec?.homepage ?? null,
    publishedAt,
  };
}

export async function fetchPubScore(name: string): Promise<PubScoreResponse | null> {
  const url = `${PUB_BASE}/packages/${encodeURIComponent(name)}/score`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json() as Promise<PubScoreResponse>;
}
