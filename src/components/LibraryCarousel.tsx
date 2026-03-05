import { useRef } from 'react';
import { LibraryCard } from './LibraryCard';
import type { PackageData } from '../types';
import type { EcosystemFilter } from '../store/ecosystemFilter';

interface Props {
  packages: PackageData[];
  isLoading: boolean;
  filter: EcosystemFilter;
}

function ArrowButton({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 w-10 h-10 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-900"
      aria-label={direction === 'left' ? 'Scroll left' : 'Scroll right'}
    >
      {direction === 'left' ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}

const FILTER_LABELS: Record<EcosystemFilter, string> = {
  all: 'npm & pub.dev',
  'react-native': 'npm',
  flutter: 'pub.dev',
};

export function LibraryCarousel({ packages, isLoading, filter }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    containerRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  const visibleCount = packages.filter((p) => !p.notFound).length;

  return (
    <section className="w-full py-12 px-4 md:px-6">
      <div className="max-w-[92rem] mx-auto">
        <div className="mb-6 px-2">
          <h2 className="text-2xl font-bold text-gray-900">Individual Packages</h2>
          <p className="text-sm text-gray-400 mt-1">
            {isLoading ? 'Loading...' : `${visibleCount} packages on ${FILTER_LABELS[filter]}`}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <ArrowButton direction="left" onClick={() => scroll('left')} />

          <div
            ref={containerRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar flex-1 pb-2"
          >
            {packages.map((pkg) => (
              <LibraryCard key={pkg.name} pkg={pkg} isLoading={isLoading} />
            ))}
          </div>

          <ArrowButton direction="right" onClick={() => scroll('right')} />
        </div>
      </div>
    </section>
  );
}
