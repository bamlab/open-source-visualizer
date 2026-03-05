import { GrowthBadge } from './GrowthBadge';
import { Sparkline } from './Sparkline';
import { LoadingSkeleton } from './LoadingSkeleton';
import { formatDownloads, simulatePubTimeline } from '../lib/dataUtils';
import { useSelectedPackage } from '../store/selectedPackage';
import type { PackageData } from '../types';

interface Props {
  pkg: PackageData;
  isLoading: boolean;
}

function ExternalLinkIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

// Flutter logo icon (simplified F)
function FlutterBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-600 text-[10px] font-semibold tracking-wide">
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14.314 0L2.3 12 6 15.7 21.684 0h-7.37zm.159 13.08l-3.182 3.196 3.182 3.22 7.408-.003-3.197-3.226 3.197-3.19-7.408.003z" />
      </svg>
      Flutter
    </span>
  );
}

export function LibraryCard({ pkg, isLoading }: Props) {
  const { selectedPackage, toggle } = useSelectedPackage();
  const isSelected = selectedPackage === pkg.name;
  const isPub = pkg.ecosystem === 'pub';

  const hasRealHistory = pkg.monthlyDownloads.length > 0;
  const sparklineData = hasRealHistory
    ? pkg.monthlyDownloads
    : isPub && pkg.totalDownloads > 0
      ? simulatePubTimeline(pkg.totalDownloads)
      : [];
  const isSimulatedSparkline = !hasRealHistory && sparklineData.length > 0;

  const downloadsLabel = isPub && !hasRealHistory
    ? '30d downloads'
    : `${pkg.monthlyDownloads.length > 0 ? pkg.monthlyDownloads.length : 18}mo downloads`;

  // For npm: strip @bam.tech/ prefix. For pub: use name as-is.
  const shortName = isPub ? pkg.name : pkg.name.replace('@bam.tech/', '');
  const scopeLabel = isPub ? 'pub.dev · bam.tech' : '@bam.tech';
  const registryUrl = isPub
    ? `https://pub.dev/packages/${encodeURIComponent(pkg.name)}`
    : `https://www.npmjs.com/package/${encodeURIComponent(pkg.name)}`;

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
          <span className="text-xs text-gray-400 font-medium">
            {isPub ? 'Not available on pub.dev' : 'Not available on npm'}
          </span>
        </div>
        <p className="font-semibold text-sm text-gray-900 font-mono">{shortName}</p>
        <p className="text-xs text-gray-400">{scopeLabel}</p>
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
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm text-gray-900 font-mono leading-snug truncate">{shortName}</p>
            <a
              href={registryUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 text-gray-300 hover:text-brand transition-colors"
              aria-label={`Open ${pkg.name} on ${isPub ? 'pub.dev' : 'npm'}`}
            >
              <ExternalLinkIcon />
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{scopeLabel}</p>
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
      {sparklineData.length > 0 && (
        <Sparkline data={sparklineData} isGrowing={pkg.isGrowing} isSimulated={isSimulatedSparkline} />
      )}

      {/* Footer stats */}
      <div className="flex items-end justify-between pt-2 border-t border-gray-100">
        <div>
          <p className="text-xl font-bold text-gray-900 leading-none">{formatDownloads(pkg.totalDownloads)}</p>
          <p className="text-xs text-gray-400 mt-1">{downloadsLabel}</p>
        </div>
        <div className="flex items-center gap-2 pb-0.5">
          {pkg.stars !== null && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <StarIcon />
              <span>{pkg.stars >= 1000 ? `${(pkg.stars / 1000).toFixed(1)}k` : pkg.stars}</span>
            </div>
          )}
        </div>
      </div>

      {/* Flutter badge — shown at the bottom for pub packages */}
      {isPub && (
        <div className="pt-1 border-t border-gray-50 flex">
          <FlutterBadge />
        </div>
      )}
    </div>
  );
}
