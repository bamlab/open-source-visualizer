import { HeroAreaChart } from './HeroAreaChart';
import { AnimatedCounter } from './AnimatedCounter';
import { LoadingSkeleton } from './LoadingSkeleton';
import type { MonthlyDownload } from '../types';

interface Props {
  totalDownloads: number;
  timeline: MonthlyDownload[];
  isLoading: boolean;
  selectedPackageName: string | null;
}

export function HeroSection({ totalDownloads, timeline, isLoading, selectedPackageName }: Props) {
  return (
    <section className="relative w-full h-screen flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Background subtle grid */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Content: centered as a unit */}
      <div className="relative z-10 w-full max-w-[92rem] px-6 md:px-10 flex flex-col items-center gap-2">
        {/* Eyebrow */}
        <p className="text-xs font-semibold tracking-widest text-brand uppercase mb-1">
          BAM.tech · Open Source Impact
        </p>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-500 tracking-tight transition-all duration-300">
          {selectedPackageName ? (
            <span className="font-mono text-gray-700">{selectedPackageName}</span>
          ) : (
            'npm Downloads'
          )}
        </h1>

        {/* Counter — the hero element */}
        {isLoading ? (
          <div className="h-24 w-56 bg-gray-200 animate-pulse rounded-xl my-2" />
        ) : (
          <div className="text-center my-1">
            <div className="text-8xl md:text-9xl font-black text-gray-900 tracking-tight leading-none">
              <AnimatedCounter target={totalDownloads} />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {selectedPackageName ? 'downloads in the last 18 months · click again to deselect' : 'downloads in the last 18 months'}
            </p>
          </div>
        )}

        {/* Chart */}
        <div className="w-full mt-4" style={{ height: 'clamp(20rem, 45vh, 36rem)' }}>
          {isLoading ? (
            <LoadingSkeleton className="w-full h-full rounded-2xl" />
          ) : timeline.length > 0 ? (
            <HeroAreaChart data={timeline} />
          ) : null}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce z-10">
        <span className="text-xs text-gray-400">Explore packages</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
