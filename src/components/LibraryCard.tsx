import { GrowthBadge } from './GrowthBadge';
import { Sparkline } from './Sparkline';
import { LoadingSkeleton } from './LoadingSkeleton';
import { formatDownloads } from '../lib/dataUtils';
import { useSelectedPackage } from '../store/selectedPackage';
import type { PackageData } from '../types';

interface Props {
  pkg: PackageData;
  isLoading: boolean;
}

function StarIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export function LibraryCard({ pkg, isLoading }: Props) {
  const { selectedPackage, toggle } = useSelectedPackage();
  const isSelected = selectedPackage === pkg.name;
  const shortName = pkg.name.replace('@bam.tech/', '');

  if (isLoading) {
    return (
      <div className="snap-start shrink-0 w-72 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <LoadingSkeleton className="h-3.5 w-36 rounded" />
            <LoadingSkeleton className="h-3 w-16 rounded" />
          </div>
          <LoadingSkeleton className="h-6 w-16 rounded-full" />
        </div>
        <LoadingSkeleton className="h-3 w-full rounded" />
        <LoadingSkeleton className="h-3 w-2/3 rounded" />
        <LoadingSkeleton className="h-14 w-full rounded-lg" />
        <div className="flex justify-between items-end pt-1 border-t border-gray-50">
          <div className="flex flex-col gap-1">
            <LoadingSkeleton className="h-5 w-16 rounded" />
            <LoadingSkeleton className="h-3 w-20 rounded" />
          </div>
          <LoadingSkeleton className="h-4 w-10 rounded" />
        </div>
      </div>
    );
  }

  if (pkg.notFound) {
    return (
      <div className="snap-start shrink-0 w-72 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
          <span className="text-xs text-gray-400 font-medium">Not available on npm</span>
        </div>
        <p className="font-semibold text-sm text-gray-900 font-mono">{shortName}</p>
        <p className="text-xs text-gray-400">@bam.tech</p>
      </div>
    );
  }

  return (
    <div
      onClick={() => !pkg.notFound && toggle(pkg.name)}
      className={`snap-start shrink-0 w-72 bg-white rounded-2xl p-5 shadow-sm border flex flex-col gap-3 transition-all cursor-pointer ${
        isSelected
          ? 'border-brand shadow-md ring-2 ring-brand/20'
          : 'border-gray-100 hover:shadow-md hover:border-gray-200'
      }`}
    >
      {/* Header row: name + badge aligned on same baseline */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-gray-900 font-mono leading-snug truncate">{shortName}</p>
          <p className="text-xs text-gray-400 mt-0.5">@bam.tech</p>
        </div>
        {pkg.isGrowing && pkg.momGrowthPct !== null && (
          <div className="shrink-0 mt-0.5">
            <GrowthBadge pct={pkg.momGrowthPct} />
          </div>
        )}
      </div>

      {/* Description — fixed height to keep cards uniform */}
      <div className="h-8">
        {pkg.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{pkg.description}</p>
        )}
      </div>

      {/* Sparkline */}
      {pkg.monthlyDownloads.length > 0 && (
        <Sparkline data={pkg.monthlyDownloads} isGrowing={pkg.isGrowing} />
      )}

      {/* Footer stats */}
      <div className="flex items-end justify-between pt-2 border-t border-gray-100">
        <div>
          <p className="text-xl font-bold text-gray-900 leading-none">{formatDownloads(pkg.totalDownloads)}</p>
          <p className="text-xs text-gray-400 mt-1">18mo downloads</p>
        </div>
        {pkg.stars !== null && (
          <div className="flex items-center gap-1 text-xs text-gray-500 pb-0.5">
            <StarIcon />
            <span>{pkg.stars >= 1000 ? `${(pkg.stars / 1000).toFixed(1)}k` : pkg.stars}</span>
          </div>
        )}
      </div>
    </div>
  );
}
