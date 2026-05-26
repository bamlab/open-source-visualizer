import type { PrRecord, RepoMeta } from '../types';

interface Props {
  repos: RepoMeta[];
  prs: PrRecord[];
}

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function TopRepos({ repos, prs }: Props) {
  const prCounts = new Map<string, number>();
  for (const pr of prs) prCounts.set(pr.repo, (prCounts.get(pr.repo) ?? 0) + 1);

  const enriched = repos
    .map((r) => ({ ...r, prCount: prCounts.get(r.name) ?? 0 }))
    .sort((a, b) => b.prCount - a.prCount || b.stars - a.stars)
    .slice(0, 12);

  const maxPrs = enriched[0]?.prCount ?? 1;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Biggest target repositories</h2>
      <p className="text-sm text-gray-500 mb-4">Ranked by PR count, with star size as a context cue</p>
      <ul className="space-y-2">
        {enriched.map((r) => (
          <li key={r.name} className="grid grid-cols-[minmax(0,18rem)_1fr_2.5rem_4rem] items-center gap-3">
            <a
              href={`https://github.com/${r.name}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-sm text-gray-800 hover:text-brand truncate block"
              title={r.name}
            >
              {r.name}
            </a>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="bg-growth rounded-full h-full"
                style={{ width: `${(r.prCount / maxPrs) * 100}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900 text-right">{r.prCount}</span>
            <span className="text-xs text-gray-400 text-right">★ {formatStars(r.stars)}</span>
          </li>
        ))}
        {enriched.length === 0 && <li className="text-sm text-gray-400">No repos yet.</li>}
      </ul>
    </div>
  );
}
