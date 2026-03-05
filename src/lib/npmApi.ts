import type { NpmDownloadResponse, NpmRegistryResponse } from '../types';

const DOWNLOADS_BASE = 'https://api.npmjs.org/downloads/range';
const REGISTRY_BASE = 'https://registry.npmjs.org';

// Fetch last 18 months of daily download data
export async function fetchDownloads(packageName: string): Promise<NpmDownloadResponse> {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 18);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const url = `${DOWNLOADS_BASE}/${fmt(start)}:${fmt(end)}/${encodeURIComponent(packageName)}`;

  const res = await fetch(url);
  if (res.status === 404) {
    throw new NotFoundError(packageName);
  }
  if (!res.ok) {
    throw new Error(`npm downloads API error ${res.status} for ${packageName}`);
  }
  return res.json();
}

export async function fetchRegistry(packageName: string): Promise<NpmRegistryResponse> {
  const url = `${REGISTRY_BASE}/${encodeURIComponent(packageName)}`;
  const res = await fetch(url);
  if (res.status === 404) {
    throw new NotFoundError(packageName);
  }
  if (!res.ok) {
    throw new Error(`npm registry API error ${res.status} for ${packageName}`);
  }
  return res.json();
}

export class NotFoundError extends Error {
  packageName: string;
  constructor(packageName: string) {
    super(`Package not found: ${packageName}`);
    this.name = 'NotFoundError';
    this.packageName = packageName;
  }
}
