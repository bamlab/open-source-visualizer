import { useAllPackageData } from './hooks/useAllPackageData';
import { useAggregatedTimeline } from './hooks/useAggregatedTimeline';
import { useSelectedPackage } from './store/selectedPackage';
import { useEcosystemFilter } from './store/ecosystemFilter';
import { HeroSection } from './components/HeroSection';
import { LibraryCarousel } from './components/LibraryCarousel';
import { simulatePubTimeline, estimatePub18Mo } from './lib/dataUtils';
import type { PackageData } from './types';

function App() {
  const { packages: rawPackages, isLoading } = useAllPackageData();
  const { selectedPackage } = useSelectedPackage();
  const { filter } = useEcosystemFilter();

  const packages = [...rawPackages].sort((a, b) => b.totalDownloads - a.totalDownloads);

  const hasPubPackages = packages.some((p) => p.ecosystem === 'pub');

  // Filter packages by ecosystem when no individual package is selected
  const filteredPackages: PackageData[] = packages.filter((p) => {
    if (filter === 'react-native') return (p.ecosystem ?? 'npm') === 'npm';
    if (filter === 'flutter') return p.ecosystem === 'pub';
    return true;
  });

  const globalTimeline = useAggregatedTimeline(filteredPackages);

  const selectedPkg = packages.find((p) => p.name === selectedPackage) ?? null;
  const isPubContext = filter === 'flutter' || selectedPkg?.ecosystem === 'pub';

  // For pub packages, extrapolate to an 18-month equivalent using available history
  const totalDownloads = selectedPkg
    ? (selectedPkg.ecosystem === 'pub'
        ? estimatePub18Mo(selectedPkg.totalDownloads, selectedPkg.monthlyDownloads, selectedPkg.publishedAt).estimated
        : selectedPkg.totalDownloads)
    : filteredPackages.reduce((sum, p) => sum + (p.ecosystem === 'pub'
        ? estimatePub18Mo(p.totalDownloads, p.monthlyDownloads, p.publishedAt).estimated
        : p.totalDownloads), 0);

  const rawTimeline = selectedPkg ? selectedPkg.monthlyDownloads : globalTimeline;
  // Monthly base (actual 30-day counts) used as simulation seed — don't multiply here
  const monthlyBase = selectedPkg?.ecosystem === 'pub'
    ? selectedPkg.totalDownloads
    : filteredPackages.filter((p) => p.ecosystem === 'pub').reduce((sum, p) => sum + p.totalDownloads, 0);
  // Simulate when pub context has ≤1 data point (pub.dev API only gives a rolling 30-day snapshot)
  const needsSimulation = isPubContext && rawTimeline.length <= 1 && monthlyBase > 0;
  const timeline = needsSimulation ? simulatePubTimeline(monthlyBase) : rawTimeline;
  const isSimulatedTimeline = needsSimulation;

  return (
    <div className="min-h-screen bg-background">
      <HeroSection
        totalDownloads={totalDownloads}
        timeline={timeline}
        isLoading={isLoading}
        selectedPackageName={selectedPkg?.name ?? null}
        hasPubPackages={hasPubPackages}
        isSimulatedTimeline={isSimulatedTimeline}
      />
      <LibraryCarousel packages={filteredPackages} isLoading={isLoading} filter={filter} />
    </div>
  );
}

export default App;
