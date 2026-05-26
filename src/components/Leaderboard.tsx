import type { PersonStat, PrRecord } from '../types';

interface Props {
  people: PersonStat[];
  prs: PrRecord[];
}

const RANK_BADGE = ['bg-yellow-400 text-yellow-900', 'bg-gray-300 text-gray-700', 'bg-orange-300 text-orange-900'];

function computeBadges(
  person: PersonStat,
  prs: PrRecord[],
  people: PersonStat[],
): { hot: boolean; top10: boolean; polyglot: boolean } {
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const recentPrCount = prs.filter(
    (pr) => pr.author === person.login && now - new Date(pr.createdAt).getTime() <= ninetyDaysMs,
  ).length;
  const hot = recentPrCount >= 3;

  const showTop10 = people.length >= 5;
  const top10Cutoff = Math.max(1, Math.ceil(people.length * 0.1));
  const rank = people.findIndex((p) => p.login === person.login) + 1;
  const top10 = showTop10 && rank > 0 && rank <= top10Cutoff;

  const polyglot = person.reposCount >= 4;

  return { hot, top10, polyglot };
}

export function Leaderboard({ people, prs }: Props) {
  const top = people.slice(0, 15);
  const max = top[0]?.prCount ?? 1;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Leaderboard</h2>
      <p className="text-sm text-gray-500 mb-4">Top contributors across the OSS ecosystem</p>
      <ol className="space-y-2">
        {top.map((p, i) => {
          const badges = computeBadges(p, prs, people);
          return (
            <li key={p.login} className="flex items-center gap-3">
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  i < 3 ? RANK_BADGE[i] : 'bg-gray-50 text-gray-400'
                }`}
              >
                {i + 1}
              </span>
              <a
                href={`https://github.com/${p.login}`}
                target="_blank"
                rel="noreferrer"
                className="flex-shrink-0"
              >
                <img
                  src={`https://github.com/${p.login}.png?size=64`}
                  alt={p.login}
                  className="w-8 h-8 rounded-full"
                />
              </a>
              <div className="flex items-center gap-1.5 flex-wrap min-w-[8rem]">
                <a
                  href={`https://github.com/${p.login}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-sm text-gray-800 hover:text-brand"
                >
                  {p.login}
                </a>
                {badges.hot && (
                  <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-medium leading-none">
                    🔥 Hot
                  </span>
                )}
                {badges.top10 && (
                  <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-[10px] font-medium leading-none">
                    🏆 Top 10%
                  </span>
                )}
                {badges.polyglot && (
                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-medium leading-none">
                    🌟 Polyglot
                  </span>
                )}
              </div>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full"
                  style={{ width: `${(p.prCount / max) * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 w-12 text-right">{p.prCount}</span>
              <span className="text-xs text-gray-400 w-16 text-right">{p.reposCount} repos</span>
            </li>
          );
        })}
        {top.length === 0 && <li className="text-sm text-gray-400">No data yet — run the fetch script.</li>}
      </ol>
    </div>
  );
}
