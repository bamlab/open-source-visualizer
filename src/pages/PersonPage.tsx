import { Link } from 'react-router-dom';
import { usePrsData } from '../hooks/usePrsData';
import { TopNav } from '../components/TopNav';
import { Leaderboard } from '../components/Leaderboard';
import { LatestPrs } from '../components/LatestPrs';
import { TopRepos } from '../components/TopRepos';
import { PrStatusPanel } from '../components/PrStatusPanel';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export function PersonPage() {
  const { data, isLoading } = usePrsData();
  const { prs, repos, people, generatedAt, org } = data;

  const totalPrs = prs.length;
  const contributors = people.length;
  const reposCount = repos.length;

  return (
    <div className="min-h-screen bg-background relative pb-24">
      <TopNav />

      <header className="relative w-full pt-24 pb-12">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative z-10 max-w-[92rem] mx-auto px-6 md:px-10 flex flex-col items-center text-center">
          <p className="text-xs font-semibold tracking-widest text-brand uppercase mb-2">
            {org.toUpperCase()} · People & Contributions
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight">
            Open source contributions
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl">
            Public PRs opened by {org} members to external JS/TS repos with ≥50 stars. Updated weekly.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-6">
            <div>
              <div className="text-3xl md:text-4xl font-black text-gray-900">{totalPrs}</div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mt-1">
                PRs
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-gray-900">{contributors}</div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mt-1">
                Contributors
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-gray-900">{reposCount}</div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mt-1">
                Repos
              </div>
            </div>
          </div>
          <Link
            to="/conferences"
            className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold shadow-sm hover:bg-brand/90 transition-colors"
          >
            🌍 Check for conferences
          </Link>
        </div>
      </header>

      <main className="max-w-[80rem] mx-auto px-6 md:px-10 flex flex-col gap-6">
        {isLoading ? (
          <>
            <LoadingSkeleton className="h-96 rounded-2xl" />
            <LoadingSkeleton className="h-96 rounded-2xl" />
            <LoadingSkeleton className="h-72 rounded-2xl" />
            <LoadingSkeleton className="h-72 rounded-2xl" />
          </>
        ) : (
          <>
            <Leaderboard people={people} prs={prs} />
            <LatestPrs prs={prs} repos={repos} />
            <TopRepos repos={repos} prs={prs} />
            <PrStatusPanel prs={prs} />
          </>
        )}
      </main>

      {generatedAt && (
        <p className="text-center text-[11px] text-gray-400 mt-10">
          Generated {new Date(generatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
