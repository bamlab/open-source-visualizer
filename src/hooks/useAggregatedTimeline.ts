import type { MonthlyDownload, PackageData } from '../types';
import { aggregateTimelines, dropCurrentMonth } from '../lib/dataUtils';

export function useAggregatedTimeline(packages: PackageData[]): MonthlyDownload[] {
  const allMonthly = packages
    .filter((p) => !p.notFound && p.monthlyDownloads.length > 0)
    .map((p) => p.monthlyDownloads);
  return dropCurrentMonth(aggregateTimelines(allMonthly));
}
