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

/**
 * Estimates pub.dev package downloads over its actual lifetime (capped at 17mo to stay
 * comparable with npm's 18-month window).
 *
 * Uses the package publish date to determine real age, skips the first (launch) month,
 * then multiplies the current 30-day velocity by that age. Packages older than 19 months
 * get ×18 (matching npm's window). Falls back to ×18 if no publish date is available.
 */
export function estimatePub18Mo(
  totalDownloads: number,
  monthlyDownloads: MonthlyDownload[],
  publishedAt?: string | null,
): { estimated: number; avgMonthly: number; effectiveMonths: number } {
  // Most recent month = best proxy for current download velocity
  const avgMonthly = monthlyDownloads.length > 0
    ? monthlyDownloads[monthlyDownloads.length - 1].downloads
    : totalDownloads;

  let effectiveMonths = 18; // fallback when no publish date

  if (publishedAt) {
    const published = new Date(publishedAt);
    const now = new Date();
    const monthsSincePublish =
      (now.getFullYear() - published.getFullYear()) * 12 +
      (now.getMonth() - published.getMonth());
    // Skip the first (launch) month; clamp between 1 and 18
    effectiveMonths = Math.min(18, Math.max(1, monthsSincePublish - 1));
  }

  return { estimated: Math.round(avgMonthly * effectiveMonths), avgMonthly, effectiveMonths };
}

export function formatDownloads(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
