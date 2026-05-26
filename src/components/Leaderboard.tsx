import type { PersonStat, PrRecord } from '../types';
import { useSelectedPerson } from '../store/selectedPerson';

interface Props {
  people: PersonStat[];
  prs: PrRecord[];
}

const RANK_BADGE = ['bg-yellow-400 text-yellow-900', 'bg-gray-300 text-gray-700', 'bg-orange-300 text-orange-900'];

function computeStreak(login: string, prs: PrRecord[]): number {
  const counts: Record<string, number> = {};
  for (const pr of prs) {
    if (pr.author !== login) continue;
    const month = pr.createdAt.slice(0, 7);
    counts[month] = (counts[month] ?? 0) + 1;
  }
  const activeMonths = Object.entries(counts)
    .filter(([, count]) => count >= 2)
    .map(([month]) => {
      const [year, mon] = month.split('-').map(Number);
      return year * 12 + mon;
    })
    .sort((a, b) => a - b);

  if (activeMonths.length === 0) return 0;

  let longest = 1;
  let current = 1;
  for (let i = 1; i < activeMonths.length; i++) {
    if (activeMonths[i] - activeMonths[i - 1] === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }
  return longest;
}

function computeBadges(
  person: PersonStat,
  prs: PrRecord[],
  people: PersonStat[],
): { hot: boolean; top10: boolean; polyglot: boolean; streak: number } {
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

  const streak = computeStreak(person.login, prs);

  return { hot, top10, polyglot, streak };
}

export function Leaderboard({ people, prs }: Props) {
  const top = people.slice(0, 15);
  const max = top[0]?.prCount ?? 1;
  const { selectedPerson, toggle } = useSelectedPerson();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Leaderboard</h2>
      <p className="text-sm text-gray-500 mb-4">Top contributors across the OSS ecosystem</p>
      <ol className="space-y-2">
        {top.map((p, i) => {
          const badges = computeBadges(p, prs, people);
          const isSelected = selectedPerson === p.login;
          return (
            <li
              key={p.login}
              className={`flex items-center gap-3 rounded-xl px-2 py-1 transition-colors ${
                isSelected ? 'ring-2 ring-brand bg-red-50' : ''
              }`}
            >
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  i < 3 ? RANK_BADGE[i] : 'bg-gray-50 text-gray-400'
                }`}
              >
                {i + 1}
              </span>
              <button
                onClick={() => toggle(p.login)}
                aria-label={`Filter contributions by ${p.login}`}
                className="flex-shrink-0 cursor-pointer bg-transparent border-0 p-0"
              >
                <img
                  src={`https://github.com/${p.login}.png?size=64`}
                  alt={p.login}
                  className="w-8 h-8 rounded-full"
                />
              </button>
              <div className="flex items-center gap-1.5 flex-wrap min-w-[8rem]">
                <button
                  onClick={() => toggle(p.login)}
                  aria-label={`Filter contributions by ${p.login}`}
                  className="cursor-pointer bg-transparent border-0 p-0 font-mono text-sm text-gray-800 hover:text-brand"
                >
                  {p.login}
                </button>
                {badges.streak >= 2 && (
                  <span
                    className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-md font-medium"
                    title={`Longest streak: ${badges.streak} consecutive months with 2+ PRs`}
                  >
                    🔥 Streak of {badges.streak}
                  </span>
                )}
                {badges.hot && (
                  <span
                    className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-md font-medium"
                    title="3+ pull requests in the last 90 days"
                  >
                    🔥 Hot
                  </span>
                )}
                {badges.top10 && (
                  <span
                    className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-md font-medium"
                    title="Ranked in the top 10% of contributors"
                  >
                    🏆 Top 10%
                  </span>
                )}
                {badges.polyglot && (
                  <span
                    className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md font-medium"
                    title="Contributed to 4+ different repositories"
                  >
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
