import { useAllPackageData } from './hooks/useAllPackageData';
import { useAggregatedTimeline } from './hooks/useAggregatedTimeline';
import { useSelectedPackage } from './store/selectedPackage';
import { HeroSection } from './components/HeroSection';
import { LibraryCarousel } from './components/LibraryCarousel';

function App() {
  const { packages: rawPackages, isLoading } = useAllPackageData();
  const { selectedPackage } = useSelectedPackage();

  const packages = [...rawPackages].sort((a, b) => b.totalDownloads - a.totalDownloads);

  const globalTimeline = useAggregatedTimeline(packages);

  const selectedPkg = packages.find((p) => p.name === selectedPackage) ?? null;
  const timeline = selectedPkg ? selectedPkg.monthlyDownloads : globalTimeline;
  const totalDownloads = selectedPkg
    ? selectedPkg.totalDownloads
    : packages.reduce((sum, p) => sum + p.totalDownloads, 0);

  return (
    <div className="min-h-screen bg-background">
      <HeroSection
        totalDownloads={totalDownloads}
        timeline={timeline}
        isLoading={isLoading}
        selectedPackageName={selectedPkg?.name ?? null}
      />
      <LibraryCarousel packages={packages} isLoading={isLoading} />
    </div>
  );
}

export default App;
