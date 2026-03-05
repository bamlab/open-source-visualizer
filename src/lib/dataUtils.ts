import type { DailyDownload, MonthlyDownload } from '../types';

export function bucketByMonth(daily: DailyDownload[]): MonthlyDownload[] {
  const map = new Map<string, number>();
  for (const { day, downloads } of daily) {
    const month = day.slice(0, 7); // 'YYYY-MM'
    map.set(month, (map.get(month) ?? 0) + downloads);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, downloads]) => ({ month, downloads }));
}

export function calcMoMGrowth(monthly: MonthlyDownload[]): number | null {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const complete = monthly.filter((m) => m.month < currentMonth);
  if (complete.length < 2) return null;
  const prev = complete[complete.length - 2].downloads;
  const last = complete[complete.length - 1].downloads;
  if (prev === 0) return null;
  return ((last - prev) / prev) * 100;
}

export function aggregateTimelines(allMonthly: MonthlyDownload[][]): MonthlyDownload[] {
  const map = new Map<string, number>();
  for (const monthly of allMonthly) {
    for (const { month, downloads } of monthly) {
      map.set(month, (map.get(month) ?? 0) + downloads);
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, downloads]) => ({ month, downloads }));
}

export function dropCurrentMonth(monthly: MonthlyDownload[]): MonthlyDownload[] {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  return monthly.filter((m) => m.month < currentMonth);
}

/**
 * Generates a deterministic simulated 18-month timeline for pub.dev packages
 * that have no historical data (only a 30-day rolling count is available).
 * The curve ramps smoothly from ~35% to 100% of the current monthly count.
 */
export function simulatePubTimeline(current30DayCount: number, months = 18): MonthlyDownload[] {
  if (current30DayCount === 0) return [];
  const today = new Date();
  const result: MonthlyDownload[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - 1 - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const t = (months - i) / months; // 1/months → 1
    const scale = 0.35 + 0.65 * Math.pow(t, 0.7);
    result.push({ month, downloads: Math.round(current30DayCount * scale) });
  }
  return result;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim();
}

export function parseGitHubOwnerRepo(url: string | undefined): { owner: string; repo: string } | null {
  if (!url) return null;
  const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

export function formatDownloads(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
