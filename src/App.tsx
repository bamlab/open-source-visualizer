import { useAllPackageData } from './hooks/useAllPackageData';
import { useAggregatedTimeline } from './hooks/useAggregatedTimeline';
import { useSelectedPackage } from './store/selectedPackage';
import { useEcosystemFilter } from './store/ecosystemFilter';
import { HeroSection } from './components/HeroSection';
import { LibraryCarousel } from './components/LibraryCarousel';
import { simulatePubTimeline } from './lib/dataUtils';
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
  const totalDownloads = selectedPkg
    ? selectedPkg.totalDownloads
    : filteredPackages.reduce((sum, p) => sum + p.totalDownloads, 0);

  const rawTimeline = selectedPkg ? selectedPkg.monthlyDownloads : globalTimeline;
  const needsSimulation = !selectedPkg && filter === 'flutter' && rawTimeline.length === 0 && totalDownloads > 0;
  const timeline = needsSimulation ? simulatePubTimeline(totalDownloads) : rawTimeline;
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
