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

export interface PubWeeklyDownloads {
  /** ISO date (YYYY-MM-DD) of the last day of the most recent week */
  endDate: string;
  /** Up to 52 weekly download counts, index 0 = most recent week */
  weeklyCounts: number[];
}

/**
 * Fetches the weekly download sparkline embedded in the pub.dev package page HTML.
 * The binary blob encodes: uint32LE end-timestamp, then up to 52 uint32LE weekly counts.
 */
export async function fetchPubWeeklyDownloads(name: string): Promise<PubWeeklyDownloads | null> {
  const res = await fetch(`https://pub.dev/packages/${encodeURIComponent(name)}`);
  if (!res.ok) return null;
  const html = await res.text();
  const match = html.match(/data-weekly-sparkline-points="([^"]+)"/);
  if (!match) return null;

  // Decode base64 using DataView (works in browser and bun/node)
  const binary = atob(match[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  if (bytes.length < 8) return null;

  const view = new DataView(bytes.buffer);
  const endTimestamp = view.getUint32(0, true); // little-endian
  const endDate = new Date(endTimestamp * 1000).toISOString().slice(0, 10);

  const weeklyCounts: number[] = [];
  for (let i = 4; i + 3 < bytes.length; i += 4) {
    weeklyCounts.push(view.getUint32(i, true));
  }

  return { endDate, weeklyCounts };
}
